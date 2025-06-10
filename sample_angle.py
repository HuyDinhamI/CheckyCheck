import cv2
import mediapipe as mp
import numpy as np
import json
import os
import time

# ==== HÀM TÍNH GÓC ====
def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

# ==== HÀM TRÍCH XUẤT GÓC ====
def extract_pose_angles(landmarks):
    def get_point(index):
        return (landmarks.landmark[index].x, landmarks.landmark[index].y)

    angles = [
        # Tay
        calculate_angle(get_point(11), get_point(13), get_point(15)),  # Gập tay trái
        calculate_angle(get_point(12), get_point(14), get_point(16)),  # Gập tay phải
        calculate_angle(get_point(15), get_point(13), get_point(11)),  # Nâng tay trái
        calculate_angle(get_point(16), get_point(14), get_point(12)),  # Nâng tay phải

        # Chân
        calculate_angle(get_point(23), get_point(25), get_point(27)),  # Gập gối trái
        calculate_angle(get_point(24), get_point(26), get_point(28)),  # Gập gối phải
        calculate_angle(get_point(25), get_point(23), get_point(11)),  # Thẳng chân trái
        calculate_angle(get_point(26), get_point(24), get_point(12)),  # Thẳng chân phải

        # Thân & đầu
        calculate_angle(get_point(11), get_point(0), get_point(12)),   # Góc đầu (cúi/ngẩng)
        calculate_angle(get_point(11), get_point(23), get_point(25)),  # Lưng trái
        calculate_angle(get_point(12), get_point(24), get_point(26)),  # Lưng phải
    ]
    return angles

# ==== SETUP ====
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_drawing = mp.solutions.drawing_utils
POSE_FOLDER = 'poses'
os.makedirs(POSE_FOLDER, exist_ok=True)

cap = cv2.VideoCapture(0)
saved = False
print("➡️ Đứng vào khung hình. Nhấn 's' để lưu pose mẫu, hoặc 'ESC' để thoát.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)

    if results.pose_landmarks:
        mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

    cv2.putText(frame, "Press 's' to save pose | 'ESC' to quit",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    cv2.imshow('Save Pose Sample', frame)

    key = cv2.waitKey(5) & 0xFF
    if key == 27:
        break
    elif key == ord('s') and results.pose_landmarks:
        angles = extract_pose_angles(results.pose_landmarks)
        filename = f"{POSE_FOLDER}/pose_{int(time.time())}.json"
        with open(filename, 'w') as f:
            json.dump(angles, f)
        print(f"✅ Đã lưu pose mẫu vào: {filename}")
        saved = True

cap.release()
cv2.destroyAllWindows()

if not saved:
    print("⚠️ Không có pose nào được lưu.")
