import cv2
import mediapipe as mp
import numpy as np
import json
import os
from datetime import datetime

def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

def extract_pose_angles(landmarks):
    def get_point(index):
        return (landmarks.landmark[index].x, landmarks.landmark[index].y)

    angles = [
        calculate_angle(get_point(11), get_point(13), get_point(15)),  # Gập tay trái
        calculate_angle(get_point(12), get_point(14), get_point(16)),  # Gập tay phải
        calculate_angle(get_point(15), get_point(13), get_point(11)),  # Nâng tay trái
        calculate_angle(get_point(16), get_point(14), get_point(12)),  # Nâng tay phải

        calculate_angle(get_point(23), get_point(25), get_point(27)),  # Gập gối trái
        calculate_angle(get_point(24), get_point(26), get_point(28)),  # Gập gối phải
        calculate_angle(get_point(25), get_point(23), get_point(11)),  # Thẳng chân trái
        calculate_angle(get_point(26), get_point(24), get_point(12)),  # Thẳng chân phải

        calculate_angle(get_point(11), get_point(0), get_point(12)),   # Góc đầu
        calculate_angle(get_point(11), get_point(23), get_point(25)),  # Lưng trái
        calculate_angle(get_point(12), get_point(24), get_point(26)),  # Lưng phải
    ]
    return angles

image_path = "c15aebf4-6cca-4e9d-b339-29d08fc03dd9.jpg"
image = cv2.imread(image_path)
if image is None:
    raise ValueError("Không thể đọc ảnh! Hãy kiểm tra lại đường dẫn.")

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(static_image_mode=True)

image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
results = pose.process(image_rgb)

if results.pose_landmarks:
    angles = extract_pose_angles(results.pose_landmarks)

    annotated = image.copy()
    mp_drawing.draw_landmarks(annotated, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
    cv2.imshow("Pose Detected", annotated)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    os.makedirs("poses", exist_ok=True)
    filename = f"sample_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    out_path = os.path.join("poses", filename)
    with open(out_path, "w") as f:
        json.dump(angles, f)

    print(f"Đã lưu tư thế vào poses/{filename}")
else:
    print("Không nhận diện được tư thế trong ảnh.")
