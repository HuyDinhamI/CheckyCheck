import pygame
import cv2
import mediapipe as mp
import numpy as np
import json
import time
import os
import random
import sys

NUM_ROUNDS = 5
TIME_PER_ROUND = 8
POSE_FOLDER = 'poses'
WIDTH, HEIGHT = 1550, 810

pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Pose Match Game")
font_path = "NotoSans-Regular.ttf"
font = pygame.font.Font(font_path, 72)
clock = pygame.time.Clock()

start_bg = pygame.image.load("start_bg.jpg")
start_bg = pygame.transform.scale(start_bg, (WIDTH, HEIGHT))

end_bg = pygame.image.load("start_bg.jpg")
end_bg = pygame.transform.scale(end_bg, (WIDTH, HEIGHT))

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_drawing = mp.solutions.drawing_utils

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
        calculate_angle(get_point(11), get_point(13), get_point(15)),
        calculate_angle(get_point(12), get_point(14), get_point(16)),
        calculate_angle(get_point(15), get_point(13), get_point(11)),
        calculate_angle(get_point(16), get_point(14), get_point(12)),
        calculate_angle(get_point(23), get_point(25), get_point(27)),
        calculate_angle(get_point(24), get_point(26), get_point(28)),
        calculate_angle(get_point(25), get_point(23), get_point(11)),
        calculate_angle(get_point(26), get_point(24), get_point(12)),
        calculate_angle(get_point(11), get_point(0), get_point(12)),
        calculate_angle(get_point(11), get_point(23), get_point(25)),
        calculate_angle(get_point(12), get_point(24), get_point(26)),
    ]
    return angles

def compare_pose_angles(p1, p2):
    if len(p1) != len(p2): return float('inf')
    return np.mean([abs(a - b) for a, b in zip(p1, p2)])

def load_all_sample_poses(folder):
    poses = []
    for f in os.listdir(folder):
        if f.endswith('.json'):
            pose_path = os.path.join(folder, f)
            with open(pose_path) as file:
                data = json.load(file)
            image_path = os.path.join(folder, f.replace('.json', '.jpg'))
            if not os.path.exists(image_path):
                image_path = os.path.join(folder, f.replace('.json', '.png'))
            data = {'angles': data, 'image': image_path}
            poses.append(data)
    return poses

def draw_text(surface, text, y, color=(0,0,0), size=72):
    font_temp = pygame.font.Font(font_path, size)
    rendered = font_temp.render(text, True, color)
    rect = rendered.get_rect(center=(WIDTH//2, y))
    surface.blit(rendered, rect)

def show_start_screen():
    screen.blit(start_bg, (0, 0))
    draw_text(screen, "POSE MATCH GAME", HEIGHT//2 - 230, color=(151,255,255))
    draw_text(screen, "Nhấn SPACE để bắt đầu", HEIGHT//2 + 310, color=(151,255,255))
    pygame.display.flip()
    waiting = True
    while waiting:
        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                pygame.quit(); sys.exit()
            if e.type == pygame.KEYDOWN and e.key == pygame.K_SPACE:
                waiting = False

def show_countdown(seconds=3):
    for i in range(seconds, 0, -1):
        screen.fill((255, 255, 255))
        draw_text(screen, f"{i}", HEIGHT//2, color=(28, 28, 28), size=200)
        pygame.display.flip()
        time.sleep(1)

def show_end_screen(score, total):
    screen.blit(end_bg, (0, 0))
    draw_text(screen, f"Tổng điểm: {score} / {total}", HEIGHT//2 - 230, color=(151,255,255))
    draw_text(screen, "Nhấn R để chơi lại / ESC để thoát", HEIGHT//2 + 310, color=(151,255,255))
    pygame.display.flip()
    while True:
        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                pygame.quit(); sys.exit()
            if e.type == pygame.KEYDOWN:
                if e.key == pygame.K_ESCAPE:
                    pygame.quit(); sys.exit()
                elif e.key == pygame.K_r:
                    main_game_loop()

def main_game_loop():
    sample_poses = load_all_sample_poses(POSE_FOLDER)
    if not sample_poses:
        raise Exception("Không có tư thế mẫu trong poses")

    cap = cv2.VideoCapture(0)
    show_start_screen()
    score_total = 0

    for round_idx in range(NUM_ROUNDS):
        sample = random.choice(sample_poses)
        current_pose_angles = sample['angles']
        sample_img = pygame.image.load(sample['image'])
        sample_img = pygame.transform.scale(sample_img, (320, 480))

        show_countdown(3)

        start_time = time.time()
        similarity_score = None

        while time.time() - start_time < TIME_PER_ROUND:
            ret, frame = cap.read()
            if not ret: break

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(frame_rgb)

            if results.pose_landmarks:
                mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
                player_angles = extract_pose_angles(results.pose_landmarks)
                similarity_score = compare_pose_angles(player_angles, current_pose_angles)

            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame = np.rot90(frame)
            frame_surface = pygame.surfarray.make_surface(frame)

            screen.fill((255, 255, 255))
            screen.blit(pygame.transform.scale(frame_surface, (WIDTH - 360, HEIGHT)), (0, 0))
            screen.blit(sample_img, (WIDTH - 340, HEIGHT//2 - 240))
            pygame.draw.rect(screen, (0, 0, 0), (WIDTH - 340, HEIGHT//2 - 240, 320, 480), 2)

            seconds_left = int(TIME_PER_ROUND - (time.time() - start_time))
            draw_text(screen, f"Round {round_idx+1}/{NUM_ROUNDS} - Time: {seconds_left}s", 40, size=48, color=(255, 0, 0))
            if similarity_score is not None:
                draw_text(screen, f"Độ lệch góc: {similarity_score:.1f}", HEIGHT - 50, size=48, color=(255, 0, 0))

            pygame.display.update()
            clock.tick(30)

        if similarity_score is not None:
            if similarity_score < 10:
                points = 10
            elif similarity_score < 20:
                points = 7
            else:
                points = 3
            score_total += points

    pygame.time.delay(1000)
    cap.release()
    show_end_screen(score_total, NUM_ROUNDS * 10)

main_game_loop()