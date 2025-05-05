/**
 * UI.js - Quản lý giao diện người dùng cho Emotion Game
 */

const UI = {
    // Các phần tử DOM
    elements: {
        // Màn hình
        welcomeScreen: document.getElementById('welcome-screen'),
        preparationScreen: document.getElementById('preparation-screen'),
        gameScreen: document.getElementById('game-screen'),
        levelCompleteScreen: document.getElementById('level-complete-screen'),
        gameCompleteScreen: document.getElementById('game-complete-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        
        // Nút
        startBtn: document.getElementById('start-btn'),
        nextLevelBtn: document.getElementById('next-level-btn'),
        playAgainBtn: document.getElementById('play-again-btn'),
        tryAgainBtn: document.getElementById('try-again-btn'),
        
        // Camera và Canvas
        video: document.getElementById('video'),
        faceCanvas: document.getElementById('face-canvas'),
        gameVideo: document.getElementById('game-video'),
        gameCanvas: document.getElementById('game-canvas'),
        
        // Thông tin màn chơi
        currentLevel: document.getElementById('current-level'),
        totalLevels: document.getElementById('total-levels'),
        totalLevelsResult: document.getElementById('total-levels-result'),
        completedLevels: document.getElementById('completed-levels'),
        timeLeft: document.getElementById('time-left'),
        
        // Thông tin cảm xúc
        targetEmotion: document.getElementById('target-emotion'),
        targetEmotionIcon: document.getElementById('target-emotion-icon'),
        completedEmotion: document.getElementById('completed-emotion'),
        detectionProgress: document.getElementById('detection-progress'),
        detectionPercentage: document.getElementById('detection-percentage'),
        emotionFeedback: document.getElementById('emotion-feedback'),
        
        // Kết quả
        accuracyResult: document.getElementById('accuracy-result'),
        totalTime: document.getElementById('total-time'),
        averageAccuracy: document.getElementById('average-accuracy'),
        
        // Đếm ngược
        countdown: document.getElementById('countdown')
    },
    
    // Khởi tạo giao diện
    init() {
        this.setupEventListeners();
    },
    
    // Thiết lập các sự kiện
    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => {
            this.showScreen('preparation');
            Game.startPreparation();
        });
        
        this.elements.nextLevelBtn.addEventListener('click', () => {
            Game.nextLevel();
        });
        
        this.elements.playAgainBtn.addEventListener('click', () => {
            Game.reset();
            this.showScreen('welcome');
        });
        
        this.elements.tryAgainBtn.addEventListener('click', () => {
            Game.reset();
            this.showScreen('welcome');
        });
    },
    
    // Hiển thị màn hình cụ thể
    showScreen(screenName) {
        // Ẩn tất cả màn hình
        this.elements.welcomeScreen.classList.add('hidden');
        this.elements.preparationScreen.classList.add('hidden');
        this.elements.gameScreen.classList.add('hidden');
        this.elements.levelCompleteScreen.classList.add('hidden');
        this.elements.gameCompleteScreen.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        
        // Hiển thị màn hình được chọn
        switch (screenName) {
            case 'welcome':
                this.elements.welcomeScreen.classList.remove('hidden');
                break;
            case 'preparation':
                this.elements.preparationScreen.classList.remove('hidden');
                break;
            case 'game':
                this.elements.gameScreen.classList.remove('hidden');
                break;
            case 'level-complete':
                this.elements.levelCompleteScreen.classList.remove('hidden');
                break;
            case 'game-complete':
                this.elements.gameCompleteScreen.classList.remove('hidden');
                break;
            case 'game-over':
                this.elements.gameOverScreen.classList.remove('hidden');
                break;
        }
    },
    
    // Cập nhật thông tin màn chơi
    updateLevelInfo(currentLevel, totalLevels) {
        this.elements.currentLevel.textContent = currentLevel;
        this.elements.totalLevels.textContent = totalLevels;
        this.elements.totalLevelsResult.textContent = totalLevels;
    },
    
    // Cập nhật thời gian còn lại
    updateTimer(seconds) {
        this.elements.timeLeft.textContent = seconds;
    },
    
    // Cập nhật cảm xúc mục tiêu
    updateTargetEmotion(emotion, icon) {
        this.elements.targetEmotion.textContent = emotion;
        if (icon) {
            this.elements.targetEmotionIcon.textContent = icon;
        }
    },
    
    // Cập nhật kết quả màn chơi
    updateLevelComplete(emotion, icon, accuracy) {
        this.elements.completedEmotion.textContent = emotion;
        if (icon) {
            document.querySelector('#level-complete-screen .emotion-icon').textContent = icon;
        }
        this.elements.accuracyResult.textContent = accuracy;
    },
    
    // Cập nhật kết quả cuối cùng
    updateFinalResults(totalTime, averageAccuracy) {
        this.elements.totalTime.textContent = totalTime;
        this.elements.averageAccuracy.textContent = averageAccuracy;
    },
    
    // Cập nhật kết quả thất bại
    updateGameOver(completedLevels, totalLevels) {
        this.elements.completedLevels.textContent = completedLevels;
        this.elements.totalLevelsResult.textContent = totalLevels;
    },
    
    // Cập nhật tiến trình nhận diện cảm xúc
    updateDetectionProgress(percentage) {
        const roundedPercentage = Math.round(percentage);
        this.elements.detectionProgress.style.width = `${roundedPercentage}%`;
        this.elements.detectionPercentage.textContent = roundedPercentage;
        
        // Cập nhật phản hồi dựa trên phần trăm
        if (percentage < 30) {
            this.elements.emotionFeedback.textContent = 'Thử lại nào! Biểu hiện rõ hơn.';
        } else if (percentage < 60) {
            this.elements.emotionFeedback.textContent = 'Đang tiến bộ! Tiếp tục cố gắng.';
        } else if (percentage < 90) {
            this.elements.emotionFeedback.textContent = 'Gần đạt rồi! Cố lên một chút nữa.';
        } else {
            this.elements.emotionFeedback.textContent = 'Tuyệt vời! Đã nhận diện thành công.';
        }
    },
    
    // Hiển thị đếm ngược
    startCountdown(seconds, onComplete) {
        let remaining = seconds;
        this.elements.countdown.textContent = remaining;
        
        const countdownInterval = setInterval(() => {
            remaining--;
            this.elements.countdown.textContent = remaining;
            
            if (remaining <= 0) {
                clearInterval(countdownInterval);
                if (typeof onComplete === 'function') {
                    onComplete();
                }
            }
        }, 1000);
    },
    
    // Vẽ khung nhận dạng khuôn mặt trên canvas
    drawFaceBox(canvas, detection, faceLabel = '') {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!detection) return;
        
        // Vẽ khung
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            detection.x,
            detection.y,
            detection.width,
            detection.height
        );
        
        // Hiển thị nhãn nếu có
        if (faceLabel) {
            ctx.fillStyle = 'rgba(76, 175, 80, 0.8)';
            ctx.fillRect(
                detection.x,
                detection.y - 20,
                detection.width,
                20
            );
            
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText(
                faceLabel,
                detection.x + 5,
                detection.y - 5
            );
        }
    }
};

// Khởi tạo UI khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
