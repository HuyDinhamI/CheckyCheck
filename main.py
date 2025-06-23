import random
import time
import pygame
import cv2
import numpy as np
from cvzone.HandTrackingModule import HandDetector
import json
import os
from datetime import datetime, timedelta
import pygame.freetype

# Initialize Pygame
pygame.init()

# Set Window Dimensions
width, height = 1280, 720
window = pygame.display.set_mode((width, height))#, pygame.FULLSCREEN)
pygame.display.set_caption("FAIC Game")

# Set Webcam Dimensions
cap = cv2.VideoCapture(0)
cap.set(3, width)
cap.set(4, height)        

# Set Log Game
def get_id():
    # Check if the file exists, otherwise create it
    try:
        # Kiểm tra nếu file tồn tại và không rỗng
        if os.path.exists("game_log.json") and os.path.getsize("game_log.json") > 0:
            with open("game_log.json", 'r', encoding="utf-8") as file:
                try:
                    data = json.load(file)  # Đọc file JSON
                except json.JSONDecodeError:
                    print("Lỗi: File JSON bị hỏng! Đang đặt lại dữ liệu...")
                    data = []  # Nếu file hỏng, đặt lại dữ liệu rỗng
        else:
            data = []  # Nếu file không tồn tại hoặc rỗng, tạo danh sách mới
    except FileNotFoundError:
        data = []

    id = len(data) + 1  # Nếu data rỗng, id sẽ là 1
    return id

def get_id_restart():
    # Check if the file exists, otherwise create it
    try:
        # Kiểm tra nếu file tồn tại và không rỗng
        if os.path.exists("game_log.json") and os.path.getsize("game_log.json") > 0:
            with open("game_log.json", 'r', encoding="utf-8") as file:
                try:
                    data = json.load(file)  # Đọc file JSON
                except json.JSONDecodeError:
                    print("Lỗi: File JSON bị hỏng! Đang đặt lại dữ liệu...")
                    data = []  # Nếu file hỏng, đặt lại dữ liệu rỗng
        else:
            data = []  # Nếu file không tồn tại hoặc rỗng, tạo danh sách mới
    except FileNotFoundError:
        data = []

    id = len(data)   # Nếu data rỗng, id sẽ là 1
    return id

def log_game_data(name, score):
    # Check if the file exists, otherwise create it
    utc_now = datetime.utcnow()
    vietnam_now = utc_now + timedelta(hours=7)

    try:
        with open('game_log.json', 'r', encoding="utf-8") as file:
            data = json.load(file)  # Read existing data
    except FileNotFoundError:
        data = []

    id = len(data) + 1
    # Prepare the log data
    game_data = {
        "id": id,
        "name": name,
        "score": score,
        "timestamp": vietnam_now.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Append new game data
    data.append(game_data)

    # Write updated data back to the JSON file
    with open('game_log.json', 'w', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=False, indent=4)  # Pretty print with indent
        

# Load Balloon Image
preferredHeight = 150
preferredWidth = 115
heightToWidth =  preferredHeight / preferredWidth

class Balloon:
    def __init__(self, property, rawImage, height, width, points, defaultSpeed, pop_sound):
        self.property = property
        self.height = height
        self.width = width
        self.rawImage = rawImage
        self.image = pygame.transform.scale(rawImage, (width, height))
        self.rect = self.image.get_rect()
        self.points = points
        self.rect.x = 500
        self.rect.y = 300
        self.speed = defaultSpeed
        self.pop_sound = pop_sound

    def randomizeLocation(self, background):
        self.rect.x = random.randint(100, background.shape[1] - 100)
        self.rect.y = background.shape[0] + 50

# tinh_yeu = Balloon('tinh_yeu', pygame.image.load('./Resources/love.png').convert_alpha(), 150, 150, 10, 11)
# tot_nghiep = Balloon('tot_nghiep', pygame.image.load('./Resources/graduation.png').convert_alpha(), 115, 150, 20, 14)
# nha = Balloon('nha', pygame.image.load('./Resources/house.png').convert_alpha(), 175, 125, 10, 8)
# oto = Balloon('oto', pygame.image.load('./Resources/car.png').convert_alpha(), 175, 125, 10, 8)
# bom = Balloon('bom', pygame.image.load('./Resources/bomb.png').convert_alpha(), 125, 125, -25, 10)
tinh_yeu = Balloon(
    'tinh_yeu', 
    pygame.image.load('./Resources/love.png').convert_alpha(), 
    140, 140, 10, 11,
    pygame.mixer.Sound('./Resources/shine-193240.mp3')  # Unique sound for 'tinh_yeu'
)
tot_nghiep = Balloon(
    'tot_nghiep', 
    pygame.image.load('./Resources/graduation.png').convert_alpha(), 
    105, 140, 20, 14,
    pygame.mixer.Sound('./Resources/successed-295058.mp3')  # Unique sound for 'tot_nghiep'
)
nha = Balloon(
    'nha', 
    pygame.image.load('./Resources/house.png').convert_alpha(), 
    165, 115, 10, 8,
    pygame.mixer.Sound('./Resources/pop.wav')  # Unique sound for 'nha'
)
oto = Balloon(
    'oto', 
    pygame.image.load('./Resources/car.png').convert_alpha(), 
    165, 115, 10, 8,
    pygame.mixer.Sound('./Resources/car-door-close-6929.mp3')  # Unique sound for 'oto'
)
bom = Balloon(
    'bom', 
    pygame.image.load('./Resources/bomb.png').convert_alpha(), 
    115, 115, -25, 10,
    pygame.mixer.Sound('./Resources/bbang-47623.mp3')  # Unique sound for 'bom'
)

balloonList = [tinh_yeu, tot_nghiep, nha, oto, bom]

def randomBalloon(balloonList):
    length = len(balloonList)
    randomIndex = random.randint(0, length - 1)

    # Reduce the occurence of star balloon
    if balloonList[randomIndex].property == 'tot_nghiep':
        secondSpin = random.randint(0, length - 1)
        return balloonList[secondSpin]

    return balloonList[randomIndex]

# Initialize Variables
streamSpeed = 1
score = 0
name = ""

# Initialize Hand Detector
detector = HandDetector(detectionCon=0.8, maxHands=1)

# Pop sound countdown
popSound = pygame.mixer.Sound('./Resources/race-start-beeps-125125.mp3')

# Show Start Page
imgBackground = pygame.image.load('./Resources/new_back.png').convert()
imgBackground = pygame.transform.scale(imgBackground, (1280, 720))
pygame.display.set_caption("Nhập thông tin")

# Font chữ
# font = pygame.freetype.Font(("./Resources/NotoSans-Regular.ttf"), 40)
font = pygame.font.Font('./Resources/NotoSans-Regular.ttf', 40)

# Biến lưu trữ dữ liệu nhập
name = ""
active_input = "name"  # Mặc định nhập tên trước

# Tạo các ô nhập
input_name_rect = pygame.Rect(width // 2 - 150, height * 9 // 10 - 50, 400, 50)

showStartPage = True

while showStartPage:
    window.fill((255, 255, 255))

    # Hiển thị tiêu đề nhập
    text_name = font.render("Nhập tên của bạn", True, (255, 255, 255))
    
    window.blit(imgBackground, (0, 0))

    window.blit(text_name, (input_name_rect.x, input_name_rect.y - 50))

    # Vẽ ô nhập
    pygame.draw.rect(window, (255, 255, 255) if active_input == "name" else (200, 200, 200), input_name_rect, 2)

    # Hiển thị nội dung nhập
    name_text = font.render(name, True, (255, 255, 255))
    window.blit(name_text, (input_name_rect.x + 10, input_name_rect.y + 3))

    pygame.display.update()

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            quit()
        
        # Kiểm tra click chuột để chuyển giữa các ô nhập
        if event.type == pygame.MOUSEBUTTONDOWN:
            if input_name_rect.collidepoint(event.pos):
                active_input = "name"

        # Nhập liệu từ bàn phím
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_BACKSPACE:  # Xóa ký tự
                if active_input == "name":
                    name = name[:-1]
            elif event.key == pygame.K_RETURN:  # Nhấn Enter để bắt đầu game
                if name.strip():  # Kiểm tra cả hai ô đã nhập chưa
                    showStartPage = False
            else:  # Thêm ký tự nhập vào
                if active_input == "name":
                    name += event.unicode


# Countdown before game starts
countdown_time = 3  # Countdown for 3 seconds
font = pygame.font.Font('./Resources/NotoSans-Regular.ttf', 100)  # Larger font for countdown
popSound.play()
for i in range(countdown_time, 0, -1):
    window.fill((255,255,255))
    countdown_text = font.render(str(i), True, (255, 255, 255))  # RGB
    countdown_rect = countdown_text.get_rect()
    countdown_rect.center = (width // 2, height * 9 // 10)  # Center on screen
    window.blit(imgBackground, (0,0))
    window.blit(countdown_text, countdown_rect)
    pygame.display.update()
    pygame.time.wait(1000)  # Wait for 1 second between each countdown

startTime = time.time()
totalTime = 10
fps = 120
clock = pygame.time.Clock()

# Choose random Balloon
balloon = randomBalloon(balloonList)

# Set a time to capture the screenshot after 5 seconds (since the game starts)
screenshot_time = startTime + 5  # Screenshot after 5 seconds from the start

# Directory to save screenshots
screenshot_dir = 'Players_images'
if not os.path.exists(screenshot_dir):
    os.makedirs(screenshot_dir)
id = get_id()
# Main Game Loop
while True:
    # Get Events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            quit()

    # Apply Logic
    timeRemain = int(totalTime - (time.time() - startTime))
    button = pygame.image.load('./Resources/button.png')
    button = pygame.transform.scale(button, (404,155))
    button_rect = button.get_rect(topleft=(400, 700))
    back_button = pygame.image.load('./Resources/back_button.png')
    back_button = pygame.transform.scale(back_button, (100, 100))  # Size of the button
    back_button_rect = back_button.get_rect(topleft=(30, 50))  # Adjust position as needed
    
    # Capture screenshot after 5 seconds
    if time.time() >= screenshot_time and not os.path.exists(f"{screenshot_dir}/PlayerID_{id}.png"):
        screenshot_filename = f"{screenshot_dir}/PlayerID_{id}.png"
        pygame.image.save(window, screenshot_filename)
        print(f"Screenshot saved as {screenshot_filename}")
        screenshot_time = float('inf')  # Prevent further screenshot capture
    if timeRemain < 0:
        finish_imgBackground = pygame.image.load('./Resources/finish_new_back.png').convert()
        finish_imgBackground = pygame.transform.scale(finish_imgBackground, (1280, 720))
        # Show Final Score
        window.fill((255, 255, 255))
        font = pygame.font.Font('./Resources/NotoSans-Regular.ttf', 60)
        textScore = font.render(f'Điểm: {score}', True, (255,255,255))
        restartText = font.render(f'Press R to restart', True, (255, 255, 255 ))
        window.blit(finish_imgBackground, (0, 0))
        window.blit(textScore, (90, 530))
        window.blit(button, button_rect.topleft)
        window.blit(back_button, back_button_rect.topleft)
        window.blit(restartText, (40, 600))
        pygame.display.update()
        log_game_data(name, score)

        # Wait for user input to restart the game (Press R)
        restart = False
        back_to_start = False
        while not restart and not back_to_start:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    quit()
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_r:
                        restart = True
                elif event.type == pygame.MOUSEBUTTONDOWN:  # Check for mouse button press
                    mouse_pos = pygame.mouse.get_pos()
                    if button_rect.collidepoint(mouse_pos):
                        restart = True
                    if back_button_rect.collidepoint(mouse_pos):
                        back_to_start = True

        if back_to_start:
            # Show Start Page
            font = pygame.font.Font('./Resources/NotoSans-Regular.ttf', 40)
            imgBackground = pygame.image.load('./Resources/new_back.png').convert()
            imgBackground = pygame.transform.scale(imgBackground, (1280, 720))
            showStartPage = True
            while showStartPage:
                # Get Events
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        pygame.quit()
                        quit()

                # Draw Start Page
                window.fill((255, 255, 255))

                # Hiển thị tiêu đề nhập
                text_name = font.render("Nhập tên của bạn", True, (255, 255, 255))
                
                window.blit(imgBackground, (0, 0))

                window.blit(text_name, (input_name_rect.x, input_name_rect.y - 50))

                # Vẽ ô nhập
                pygame.draw.rect(window, (255, 255, 255) if active_input == "name" else (200, 200, 200), input_name_rect, 2)

                name_text = ""
                # Hiển thị nội dung nhập
                name_text = font.render(name, True, (255, 255, 255))
                window.blit(name_text, (input_name_rect.x + 10, input_name_rect.y + 3))

                pygame.display.update()

                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        pygame.quit()
                        quit()
                    
                    # Kiểm tra click chuột để chuyển giữa các ô nhập
                    if event.type == pygame.MOUSEBUTTONDOWN:
                        if input_name_rect.collidepoint(event.pos):
                            active_input = "name"

                    # Nhập liệu từ bàn phím
                    if event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_BACKSPACE:  # Xóa ký tự
                            if active_input == "name":
                                name = name[:-1]
                            else:
                                mssv = mssv[:-1]
                        elif event.key == pygame.K_RETURN:  # Nhấn Enter để bắt đầu game
                            if name.strip():  # Kiểm tra cả hai ô đã nhập chưa
                                showStartPage = False
                        else:  # Thêm ký tự nhập vào
                            if active_input == "name":
                                name += event.unicode

            # Countdown before game starts
            countdown_time = 3  # Countdown for 3 seconds
            font = pygame.font.Font('./Resources/NotoSans-Regular.ttf', 100)  # Larger font for countdown
            popSound.play()
            for i in range(countdown_time, 0, -1):
                window.fill((255,255,255))
                countdown_text = font.render(str(i), True, (255,255,255))  # RGB
                countdown_rect = countdown_text.get_rect()
                countdown_rect.center = (width // 2, height * 9 // 10)  # Center on screen
                window.blit(imgBackground, (0,0))
                window.blit(countdown_text, countdown_rect)
                pygame.display.update()
                pygame.time.wait(1000)  # Wait for 1 second between each countdown
            
            # Reset game values
            score = 0
            startTime = time.time()
            streamSpeed = 1
            balloon = randomBalloon(balloonList)
            # Set a time to capture the screenshot after 5 seconds (since the game starts)
            screenshot_time = startTime + 5  # Screenshot after 5 seconds from the start

            # Directory to save screenshots
            screenshot_dir = 'Players_images'
            if not os.path.exists(screenshot_dir):
                os.makedirs(screenshot_dir)
            id = get_id()
            
        if restart:
            # Countdown before game starts
            countdown_time = 3  # Countdown for 3 seconds
            font = pygame.font.Font('./Resources/NotoSans-Regular.ttf', 100)  # Larger font for countdown
            popSound.play()
            for i in range(countdown_time, 0, -1):
                window.fill((255,255,255))
                countdown_text = font.render(str(i), True, (255,255,255))  # RGB
                countdown_rect = countdown_text.get_rect()
                countdown_rect.center = (width // 2, height * 9 // 10)  # Center on screen
                window.blit(imgBackground, (0,0))
                window.blit(countdown_text, countdown_rect)
                pygame.display.update()
                pygame.time.wait(1000)  # Wait for 1 second between each countdown
            # Reset game values when restarting
            score = 0
            startTime = time.time()
            streamSpeed = 1
            balloon = randomBalloon(balloonList)
            id = get_id_restart()


    else:
        # OPENCV handling
        success, img = cap.read()
        img = cv2.flip(img, 1)
        hands, img = detector.findHands(img, flipType=False)
        balloon.rect.y -= balloon.speed + streamSpeed
        
        # Check if balloon reached top without being popped
        if balloon.rect.y < 0:
            balloon = randomBalloon(balloonList)
            balloon.randomizeLocation(img)
            streamSpeed += 0.5

        if hands:
            hand = hands[0]
            x, y, z = hand['lmList'][8]
            if balloon.rect.collidepoint(x, y):
                score += balloon.points
                balloon.pop_sound.play()
                streamSpeed += 1
                balloon = randomBalloon(balloonList)
                balloon.randomizeLocation(img)
        
        # Convert image for display in pygame
        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        imgRGB = np.rot90(imgRGB)
        frame = pygame.surfarray.make_surface(imgRGB).convert()
        frame = pygame.transform.flip(frame, True, False)
        
        # Display updated frame
        window.blit(frame, (0, 0))
        window.blit(balloon.image, balloon.rect)

        # Display score and remaining time
        font = pygame.font.Font('./Resources/NotoSans-Regular.ttf', 50)
        textScore = font.render(f'Điểm: {score}', True, (255,255,255))
        textTime = font.render(f'Thời gian: {timeRemain}', True, (255,255,255))
        window.blit(textScore, (35, 35))
        window.blit(textTime, (980, 35))
        
    # Update Display
    pygame.display.update()

    # Set FPS
    clock.tick(fps)
