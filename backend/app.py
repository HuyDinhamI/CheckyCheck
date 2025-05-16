# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import random
import json
import os
import time
from PIL import Image
import numpy as np

# Import module nhận diện cảm xúc
from emotion_detector import EmotionDetector

app = Flask(__name__)
CORS(app) # Kích hoạt CORS cho tất cả các route, cần thiết để frontend giao tiếp

# Khởi tạo detector toàn cục
detector = None
DICT_EMO = {0: 'Neutral', 1: 'Happiness', 2: 'Sadness', 3: 'Surprise', 4: 'Fear', 5: 'Disgust', 6: 'Anger'}
EMO_IDS = {v: k for k, v in DICT_EMO.items()} # Đảo ngược dictionary để tra cứu theo tên

# Thông tin vòng chơi cơ bản
DEFAULT_THRESHOLD = 0.75 # Ngưỡng mặc định để vượt qua một vòng
DEFAULT_ROUNDS = [
    {"emotion": "Happiness", "threshold": DEFAULT_THRESHOLD, "time_limit": 10}, # 10 giây
    {"emotion": "Sadness", "threshold": DEFAULT_THRESHOLD, "time_limit": 15},
    {"emotion": "Surprise", "threshold": DEFAULT_THRESHOLD, "time_limit": 8}
]

# Đường dẫn tệp bảng xếp hạng (đơn giản, sử dụng JSON)
LEADERBOARD_FILE = os.path.join(os.path.dirname(__file__), 'leaderboard.json')

@app.route('/')
def home():
    return "Welcome to the Emotion Recognition Game Backend!"

@app.route('/game_modes', methods=['GET'])
def game_modes_api():
    """Trả về danh sách các chế độ chơi có sẵn"""
    return jsonify({
        "modes": [
            {
                "id": "basic",
                "name": "Basic (3 emotions)",
                "description": "Express 3 emotions correctly to win"
            },
            {
                "id": "time_attack",
                "name": "Time Attack",
                "description": "Express emotions before time runs out"
            },
            {
                "id": "emotion_master",
                "name": "Emotion Master",
                "description": "Express a series of emotions in sequence"
            },
            {
                "id": "intensity",
                "name": "Intensity Challenge",
                "description": "Maintain emotion intensity in a specific range"
            }
        ]
    })

@app.route('/start_game_round', methods=['POST'])
def start_game_round_api():
    """Khởi tạo một vòng chơi mới và trả về thông tin cần thiết"""
    data = request.get_json()
    game_mode = data.get('game_mode', 'basic')
    round_num = data.get('current_round', 0)
    
    # Các chế độ chơi khác nhau có thể có logic khác nhau
    if game_mode == 'basic':
        # Chế độ cơ bản 3 vòng
        if round_num >= len(DEFAULT_ROUNDS):
            return jsonify({"game_completed": True})
        
        round_info = DEFAULT_ROUNDS[round_num]
        return jsonify({
            "target_emotion": round_info["emotion"],
            "threshold": round_info["threshold"],
            "time_limit": round_info["time_limit"],
            "round": round_num
        })
        
    elif game_mode == 'time_attack':
        # Chọn cảm xúc ngẫu nhiên & thời gian giới hạn giảm dần
        emotions = list(DICT_EMO.values())
        emotion = random.choice(emotions)
        time_limit = max(5, 15 - round_num * 2)  # Bắt đầu từ 15s, mỗi vòng giảm 2s, tối thiểu 5s
        
        return jsonify({
            "target_emotion": emotion,
            "threshold": DEFAULT_THRESHOLD,
            "time_limit": time_limit,
            "round": round_num
        })
        
    elif game_mode == 'emotion_master':
        # Danh sách chuỗi cảm xúc cần thể hiện
        emotions = list(DICT_EMO.values())
        # Số lượng cảm xúc tăng dần theo round
        num_emotions = min(7, 2 + round_num)
        emotion_sequence = [random.choice(emotions) for _ in range(num_emotions)]
        
        return jsonify({
            "emotion_sequence": emotion_sequence,
            "current_emotion_index": 0,
            "threshold": DEFAULT_THRESHOLD,
            "time_limit": 30,  # Tổng thời gian cho cả chuỗi
            "round": round_num
        })
        
    elif game_mode == 'intensity':
        emotions = list(DICT_EMO.values())
        emotion = random.choice(emotions)
        # Yêu cầu duy trì cảm xúc ở một khoảng cụ thể
        min_intensity = 0.7
        max_intensity = 0.9
        sustain_time = 3  # Số giây cần duy trì trong khoảng để hoàn thành
        
        return jsonify({
            "target_emotion": emotion,
            "min_intensity": min_intensity,
            "max_intensity": max_intensity,
            "sustain_time": sustain_time,
            "time_limit": 20,
            "round": round_num
        })
    
    else:
        return jsonify({"error": "Invalid game mode"}), 400

@app.route('/process_frame', methods=['POST'])
def process_frame_api():
    """Xử lý khung hình từ camera và trả về kết quả nhận diện cảm xúc"""
    data = request.get_json()
    if 'image_data' not in data:
        return jsonify({"error": "Missing image_data"}), 400
    
    # Thông tin trạng thái game
    game_mode = data.get('game_mode', 'basic')
    target_emotion = data.get('target_emotion')
    threshold = data.get('threshold', DEFAULT_THRESHOLD)
    
    # Đặc thù cho chế độ intensity
    min_intensity = data.get('min_intensity', 0)
    max_intensity = data.get('max_intensity', 1.0)
    
    # Xử lý ảnh từ base64 string
    try:
        image_data = data['image_data']
        # Loại bỏ tiền tố "data:image/jpeg;base64," nếu có
        if 'data:' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        # Chuyển đổi sang đối tượng PIL Image
        frame_pil = Image.open(io.BytesIO(image_bytes))
        
        # Gọi detector để nhận diện cảm xúc
        detected_emotion, confidence, face_box = detector.detect_emotion_from_image(frame_pil)
        
        # Tính kết quả dựa trên game mode và trạng thái
        passed_round = False
        in_intensity_range = False
        
        if detected_emotion != "N/A" and target_emotion:
            # Đối với mode intensity, kiểm tra xem có nằm trong khoảng không
            if game_mode == 'intensity':
                if detected_emotion == target_emotion and min_intensity <= confidence <= max_intensity:
                    in_intensity_range = True
                    # Việc tính "passed_round" sẽ xử lý ở phía client dựa trên thời gian đã duy trì
                
            # Đối với các mode khác, đơn giản là so sánh với ngưỡng
            elif detected_emotion == target_emotion and confidence >= threshold:
                passed_round = True
        
        # Trả về kết quả
        result = {
            "detected_emotion": detected_emotion,
            "confidence": float(confidence),
            "passed_round": passed_round,
            "in_intensity_range": in_intensity_range
        }
        
        # Nếu có khuôn mặt, trả về tọa độ
        if face_box:
            result["face_box"] = {
                "x": int(face_box[0]),
                "y": int(face_box[1]),
                "width": int(face_box[2] - face_box[0]),
                "height": int(face_box[3] - face_box[1])
            }
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/submit_score', methods=['POST'])
def submit_score_api():
    """Lưu điểm số của người chơi vào bảng xếp hạng"""
    data = request.get_json()
    
    if not all(key in data for key in ['player_name', 'score', 'game_mode']):
        return jsonify({"error": "Missing required fields"}), 400
    
    player_name = data['player_name']
    score = data['score']
    game_mode = data['game_mode']
    
    # Đọc bảng xếp hạng hiện tại (nếu có)
    leaderboard = []
    if os.path.exists(LEADERBOARD_FILE):
        try:
            with open(LEADERBOARD_FILE, 'r') as f:
                leaderboard = json.load(f)
        except:
            pass
    
    # Thêm điểm số mới
    new_entry = {
        "player_name": player_name,
        "score": score,
        "game_mode": game_mode,
        "timestamp": int(time.time())  # Unix timestamp
    }
    leaderboard.append(new_entry)
    
    # Lưu lại bảng xếp hạng
    try:
        with open(LEADERBOARD_FILE, 'w') as f:
            json.dump(leaderboard, f)
    except Exception as e:
        print(f"Error saving leaderboard: {str(e)}")
        return jsonify({"error": "Failed to save score"}), 500
    
    return jsonify({"success": True})

@app.route('/leaderboard', methods=['GET'])
def get_leaderboard_api():
    """Lấy bảng xếp hạng"""
    game_mode = request.args.get('game_mode')  # Tùy chọn, lọc theo chế độ chơi
    limit = int(request.args.get('limit', 10))  # Số lượng kết quả tối đa
    
    # Đọc bảng xếp hạng
    if os.path.exists(LEADERBOARD_FILE):
        try:
            with open(LEADERBOARD_FILE, 'r') as f:
                leaderboard = json.load(f)
        except:
            leaderboard = []
    else:
        leaderboard = []
    
    # Lọc theo game_mode nếu được yêu cầu
    if game_mode:
        leaderboard = [entry for entry in leaderboard if entry.get('game_mode') == game_mode]
    
    # Sắp xếp theo điểm số giảm dần
    leaderboard.sort(key=lambda x: x['score'], reverse=True)
    
    # Chỉ trả về số lượng kết quả tối đa theo yêu cầu
    return jsonify({"leaderboard": leaderboard[:limit]})

if __name__ == '__main__':
    # Khởi tạo EmotionDetector
    detector = EmotionDetector(
        backbone_model_path="models/FER_static_ResNet50_AffectNet.pt",
        lstm_model_path_template="models/FER_dinamic_LSTM_{0}.pt",
        lstm_model_name="Aff-Wild2"
    )
    
    app.run(debug=True, port=5000) # Chạy Flask server
