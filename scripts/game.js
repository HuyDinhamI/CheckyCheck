/**
 * game.js - Quản lý logic chính của game Emotion Challenge
 */

const Game = {
    // Cấu hình game
    config: {
        preparationTime: 3, // Thời gian chuẩn bị (giây)
        levelTime: 30, // Thời gian cho mỗi màn (giây)
        minDetectionThreshold: 90, // Ngưỡng nhận diện tối thiểu để vượt qua màn chơi (%)
        detectionSuccessTime: 2, // Thời gian duy trì nhận diện thành công (giây)
    },
    
    // Trạng thái game
    state: {
        isPlaying: false,
        currentLevel: 1,
        totalLevels: 5,
        timeRemaining: 0,
        timerInterval: null,
        levelStartTime: 0,
        detectionSuccess: false,
        successStartTime: 0,
        accuracyHistory: [],
    },
    
    // Danh sách các màn chơi
    levels: [
        { emotion: 'happy', label: 'Vui Vẻ', icon: '😊', instruction: 'Hãy cười thật tươi!' },
        { emotion: 'surprise', label: 'Ngạc Nhiên', icon: '😲', instruction: 'Hãy tỏ ra bất ngờ!' },
        { emotion: 'sad', label: 'Buồn Bã', icon: '😢', instruction: 'Hãy tỏ ra buồn bã!' },
        { emotion: 'angry', label: 'Giận Dữ', icon: '😠', instruction: 'Hãy thể hiện sự tức giận!' },
        { emotion: 'fear', label: 'Sợ Hãi', icon: '😨', instruction: 'Hãy thể hiện sự sợ hãi!' },
    ],
    
    // Khởi tạo game
    async init() {
        // Khởi tạo Emotion Detector
        const initialized = await EmotionDetector.init();
        if (!initialized) {
            alert('Không thể khởi tạo hệ thống nhận diện cảm xúc. Vui lòng thử lại sau.');
            return false;
        }
        
        return true;
    },
    
    // Bắt đầu giai đoạn chuẩn bị
    async startPreparation() {
        // Đặt lại trạng thái
        this.resetState();
        
        // Cập nhật thông tin màn chơi
        UI.updateLevelInfo(this.state.currentLevel, this.state.totalLevels);
        
        try {
            // Thiết lập camera
            const cameraReady = await EmotionDetector.setupCamera(UI.elements.video);
            if (!cameraReady) {
                alert('Không thể truy cập camera. Vui lòng cấp quyền và thử lại.');
                UI.showScreen('welcome');
                return;
            }
            
            // Bắt đầu đếm ngược chuẩn bị
            UI.startCountdown(this.config.preparationTime, () => {
                this.startLevel();
            });
        } catch (error) {
            console.error('Error during preparation:', error);
            alert('Đã xảy ra lỗi khi chuẩn bị. Vui lòng thử lại.');
            UI.showScreen('welcome');
        }
    },
    
    // Bắt đầu màn chơi
    startLevel() {
        const currentLevelData = this.levels[this.state.currentLevel - 1];
        
        // Chuyển sang màn hình chơi game
        UI.showScreen('game');
        
        // Cập nhật thông tin màn chơi
        UI.updateTargetEmotion(currentLevelData.label, currentLevelData.icon);
        
        // Thiết lập camera cho màn chơi
        EmotionDetector.setupCamera(UI.elements.gameVideo).then(() => {
            // Khởi tạo thời gian
            this.state.timeRemaining = this.config.levelTime;
            this.state.levelStartTime = Date.now();
            UI.updateTimer(this.state.timeRemaining);
            
            // Bắt đầu nhận diện cảm xúc
            EmotionDetector.startDetection(
                UI.elements.gameVideo,
                UI.elements.gameCanvas,
                currentLevelData.emotion,
                this.handleDetectionResult.bind(this)
            );
            
            // Bắt đầu đếm ngược thời gian
            this.state.isPlaying = true;
            this.state.timerInterval = setInterval(() => {
                this.updateGameTimer();
            }, 1000);
        });
    },
    
    // Xử lý kết quả nhận diện cảm xúc
    handleDetectionResult(result) {
        if (!this.state.isPlaying) return;
        
        if (result.faceDetected) {
            // Cập nhật tiến trình nhận diện
            UI.updateDetectionProgress(result.targetMatching);
            
            // Kiểm tra xem đã đạt ngưỡng thành công chưa
            if (result.targetMatching >= this.config.minDetectionThreshold) {
                if (!this.state.detectionSuccess) {
                    // Bắt đầu tính thời gian duy trì cảm xúc thành công
                    this.state.detectionSuccess = true;
                    this.state.successStartTime = Date.now();
                } else {
                    // Kiểm tra xem đã duy trì đủ lâu chưa
                    const successDuration = (Date.now() - this.state.successStartTime) / 1000;
                    if (successDuration >= this.config.detectionSuccessTime) {
                        // Hoàn thành màn chơi
                        this.completeLevel(result.targetMatching);
                    }
                }
            } else {
                // Đặt lại trạng thái thành công nếu không đạt ngưỡng
                this.state.detectionSuccess = false;
            }
        } else {
            // Đặt lại trạng thái thành công nếu không phát hiện khuôn mặt
            this.state.detectionSuccess = false;
            UI.updateDetectionProgress(0);
        }
    },
    
    // Cập nhật đếm ngược thời gian
    updateGameTimer() {
        this.state.timeRemaining--;
        UI.updateTimer(this.state.timeRemaining);
        
        if (this.state.timeRemaining <= 0) {
            // Hết thời gian
            this.gameOver();
        }
    },
    
    // Hoàn thành màn chơi
    completeLevel(accuracy) {
        // Dừng game
        this.pauseGame();
        
        // Lưu độ chính xác
        this.state.accuracyHistory.push(Math.round(accuracy));
        
        const currentLevelData = this.levels[this.state.currentLevel - 1];
        
        // Cập nhật kết quả màn chơi
        UI.updateLevelComplete(
            currentLevelData.label,
            currentLevelData.icon,
            Math.round(accuracy)
        );
        
        // Chuyển sang màn hình hoàn thành
        UI.showScreen('level-complete');
    },
    
    // Chuyển sang màn tiếp theo
    nextLevel() {
        // Tăng màn chơi
        this.state.currentLevel++;
        
        // Kiểm tra xem đã hoàn thành tất cả chưa
        if (this.state.currentLevel > this.state.totalLevels) {
            this.completeGame();
            return;
        }
        
        // Bắt đầu màn chơi mới
        this.startPreparation();
    },
    
    // Hoàn thành toàn bộ game
    completeGame() {
        // Tính thời gian hoàn thành
        const totalTime = Math.round((Date.now() - this.state.levelStartTime) / 1000) + 
                         (this.config.levelTime * (this.state.totalLevels - 1));
        
        // Tính độ chính xác trung bình
        const averageAccuracy = Math.round(
            this.state.accuracyHistory.reduce((sum, acc) => sum + acc, 0) / 
            this.state.accuracyHistory.length
        );
        
        // Cập nhật kết quả cuối cùng
        UI.updateFinalResults(totalTime, averageAccuracy);
        
        // Chuyển sang màn hình hoàn thành game
        UI.showScreen('game-complete');
        
        // Dừng camera
        EmotionDetector.stopCamera();
    },
    
    // Game over (hết thời gian)
    gameOver() {
        // Dừng game
        this.pauseGame();
        
        // Cập nhật thông tin game over
        UI.updateGameOver(this.state.currentLevel - 1, this.state.totalLevels);
        
        // Chuyển sang màn hình game over
        UI.showScreen('game-over');
        
        // Dừng camera
        EmotionDetector.stopCamera();
    },
    
    // Tạm dừng game
    pauseGame() {
        this.state.isPlaying = false;
        
        // Xóa interval đếm ngược
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
        
        // Dừng nhận diện
        EmotionDetector.stopDetection();
    },
    
    // Đặt lại trạng thái game
    resetState() {
        this.state.isPlaying = false;
        this.state.currentLevel = 1;
        this.state.timeRemaining = this.config.levelTime;
        this.state.timerInterval = null;
        this.state.levelStartTime = 0;
        this.state.detectionSuccess = false;
        this.state.successStartTime = 0;
        this.state.accuracyHistory = [];
        
        // Dừng nhận diện và camera nếu đang chạy
        EmotionDetector.stopDetection();
        EmotionDetector.stopCamera();
    },
    
    // Reset game hoàn toàn
    reset() {
        this.resetState();
    }
};
