/**
 * Module quản lý logic chơi game
 */

import { 
    processFrame, 
    startGameRound, 
    submitScore, 
    getLeaderboard,
    GameRoundInfo,
    ProcessFrameResponse
} from './apiService';
import { uiManager, SCREENS } from './ui';

/**
 * Định nghĩa trạng thái game
 */
interface GameState {
    gameMode: string;
    currentRound: number;
    roundInfo: GameRoundInfo | null;
    score: number;
    timeLeft: number;
    timerInterval: number | null;
    frameProcessingActive: boolean;
    sustainedTime: number; // Cho chế độ Intensity
    isGameActive: boolean;
}

/**
 * Class quản lý logic chơi game
 */
export class GameManager {
    private state: GameState = {
        gameMode: 'basic',
        currentRound: 0,
        roundInfo: null,
        score: 0,
        timeLeft: 0,
        timerInterval: null,
        frameProcessingActive: false,
        sustainedTime: 0,
        isGameActive: false
    };

    private webcam: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private mediaStream: MediaStream | null = null;
    private frameProcessingId: number | null = null;
    private lastFrameTime: number = 0;
    private frameInterval: number = 500; // ms giữa các frame xử lý

    constructor() {
        this.webcam = document.getElementById('webcam') as HTMLVideoElement | null;
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }
        
        this.setupUiEvents();
    }

    /**
     * Thiết lập các event listener UI
     */
    private setupUiEvents(): void {
        uiManager.on('gameMode:selected', (gameMode: string) => {
            this.startGame(gameMode);
        });

        uiManager.on('game:exit', () => {
            this.endGame();
            uiManager.showScreen(SCREENS.WELCOME);
        });

        uiManager.on('game:restart', () => {
            this.startGame(this.state.gameMode);
        });

        uiManager.on('score:submit', (playerName: string) => {
            this.submitScore(playerName);
        });

        uiManager.on('leaderboard:show', () => {
            this.loadLeaderboard();
        });

        uiManager.on('leaderboard:filter', (gameMode: string) => {
            this.loadLeaderboard(gameMode);
        });
    }

    /**
     * Khởi tạo camera
     */
    private async initCamera(): Promise<boolean> {
        try {
            // Yêu cầu quyền truy cập camera
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            if (this.webcam) {
                this.webcam.srcObject = this.mediaStream;
                return new Promise<boolean>((resolve) => {
                    if (this.webcam) {
                        this.webcam.onloadedmetadata = () => {
                            if (this.canvas && this.ctx && this.webcam) {
                                this.canvas.width = this.webcam.videoWidth;
                                this.canvas.height = this.webcam.videoHeight;
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        };
                    } else {
                        resolve(false);
                    }
                });
            }
            return false;
        } catch (error) {
            console.error('Không thể truy cập camera:', error);
            alert('Không thể truy cập camera. Vui lòng cho phép truy cập camera để chơi game.');
            return false;
        }
    }

    /**
     * Bắt đầu game mới
     */
    public async startGame(gameMode: string): Promise<void> {
        // Reset trạng thái
        this.state = {
            gameMode,
            currentRound: 0,
            roundInfo: null,
            score: 0,
            timeLeft: 0,
            timerInterval: null,
            frameProcessingActive: false,
            sustainedTime: 0,
            isGameActive: true
        };

        // Khởi tạo camera
        const cameraInitialized = await this.initCamera();
        if (!cameraInitialized) {
            return;
        }

        // Chuẩn bị UI
        uiManager.prepareGameScreen(gameMode);

        // Bắt đầu vòng đầu tiên
        await this.startRound();

        // Bắt đầu xử lý frame
        this.startFrameProcessing();
    }

    /**
     * Bắt đầu một vòng chơi mới
     */
    private async startRound(): Promise<void> {
        try {
            // Gọi API để lấy thông tin vòng chơi
            const roundInfo = await startGameRound(this.state.gameMode, this.state.currentRound);
            this.state.roundInfo = roundInfo;

            // Kiểm tra nếu game đã hoàn thành
            if (roundInfo.game_completed) {
                this.completeGame();
                return;
            }

            // Cập nhật UI
            if (roundInfo.target_emotion) {
                uiManager.updateGameInfo(
                    roundInfo.target_emotion,
                    this.state.currentRound,
                    roundInfo.time_limit
                );
            } else if (roundInfo.emotion_sequence && roundInfo.current_emotion_index !== undefined) {
                // Chế độ Emotion Master
                const currentEmotion = roundInfo.emotion_sequence[roundInfo.current_emotion_index];
                uiManager.updateGameInfo(
                    currentEmotion,
                    this.state.currentRound,
                    roundInfo.time_limit
                );
            }

            // Thiết lập thanh đo cường độ nếu cần (cho chế độ Intensity)
            if (this.state.gameMode === 'intensity' && roundInfo.min_intensity !== undefined && roundInfo.max_intensity !== undefined) {
                uiManager.updateIntensityMeter(
                    true,
                    0,
                    roundInfo.min_intensity,
                    roundInfo.max_intensity
                );
            }

            // Khởi động timer
            this.startTimer(roundInfo.time_limit);

        } catch (error) {
            console.error('Error starting round:', error);
            alert('Có lỗi xảy ra khi bắt đầu vòng chơi. Vui lòng thử lại.');
        }
    }

    /**
     * Khởi động timer đếm ngược
     */
    private startTimer(seconds: number): void {
        // Dừng timer hiện tại nếu có
        if (this.state.timerInterval !== null) {
            clearInterval(this.state.timerInterval);
        }

        this.state.timeLeft = seconds;
        uiManager.updateTimer(seconds);

        this.state.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            uiManager.updateTimer(this.state.timeLeft);

            if (this.state.timeLeft <= 0) {
                clearInterval(this.state.timerInterval as number);
                this.state.timerInterval = null;
                
                // Hết thời gian -> tùy theo chế độ chơi
                if (this.state.gameMode === 'time_attack') {
                    // Với Time Attack, hết thời gian đồng nghĩa với kết thúc game
                    this.completeGame();
                } else {
                    // Với các chế độ khác, chuyển sang vòng tiếp theo
                    this.nextRound(false);
                }
            }
        }, 1000);
    }

    /**
     * Bắt đầu xử lý frame từ camera
     */
    private startFrameProcessing(): void {
        this.state.frameProcessingActive = true;
        this.lastFrameTime = Date.now();
        
        const processFrameLoop = async (): Promise<void> => {
            if (!this.state.frameProcessingActive || !this.state.isGameActive) {
                return;
            }

            const now = Date.now();
            // Chỉ xử lý frame nếu đủ thời gian từ lần cuối
            if (now - this.lastFrameTime >= this.frameInterval) {
                this.lastFrameTime = now;
                await this.processCurrentFrame();
            }

            this.frameProcessingId = requestAnimationFrame(processFrameLoop);
        };

        this.frameProcessingId = requestAnimationFrame(processFrameLoop);
    }

    /**
     * Xử lý frame hiện tại từ camera
     */
    private async processCurrentFrame(): Promise<void> {
        if (!this.webcam || !this.canvas || !this.ctx || !this.state.roundInfo) {
            return;
        }

        // Vẽ khung hình hiện tại lên canvas
        this.ctx.drawImage(this.webcam, 0, 0, this.canvas.width, this.canvas.height);
        
        // Chuyển đổi canvas thành base64 image data
        const imageData = this.canvas.toDataURL('image/jpeg', 0.8);

        try {
            // Lấy thông tin cần thiết từ state
            const gameMode = this.state.gameMode;
            let targetEmotion: string | undefined;
            let threshold = this.state.roundInfo.threshold || 0.75;
            let minIntensity = this.state.roundInfo.min_intensity || 0;
            let maxIntensity = this.state.roundInfo.max_intensity || 1.0;

            // Lấy target emotion tùy theo chế độ chơi
            if (gameMode === 'emotion_master' && this.state.roundInfo.emotion_sequence && this.state.roundInfo.current_emotion_index !== undefined) {
                targetEmotion = this.state.roundInfo.emotion_sequence[this.state.roundInfo.current_emotion_index];
            } else {
                targetEmotion = this.state.roundInfo.target_emotion;
            }

            // Gọi API để xử lý frame
            const result = await processFrame(
                imageData, 
                gameMode, 
                targetEmotion, 
                threshold, 
                minIntensity, 
                maxIntensity
            );

            // Cập nhật UI với kết quả nhận diện
            this.handleFrameProcessResult(result);

        } catch (error) {
            console.error('Error processing frame:', error);
        }
    }

    /**
     * Xử lý kết quả nhận diện từ một frame
     */
    private handleFrameProcessResult(result: ProcessFrameResponse): void {
        // Cập nhật UI với cảm xúc nhận diện được và độ tin cậy
        uiManager.updateDetectedEmotion(result.detected_emotion, result.confidence);
        
        // Cập nhật hộp khuôn mặt nếu có
        if (result.face_box) {
            uiManager.updateFaceBox(result.face_box);
        } else {
            uiManager.updateFaceBox(null);
        }

        // Xử lý theo chế độ chơi
        if (this.state.gameMode === 'intensity' && result.in_intensity_range) {
            // Chế độ Intensity: Duy trì cảm xúc trong khoảng mục tiêu
            this.handleIntensityMode(result);
        } else if (result.passed_round) {
            // Các chế độ khác: Nếu vượt qua vòng
            this.handleRoundPassed();
        }

        // Cập nhật thanh đo cường độ nếu đang ở chế độ Intensity
        if (this.state.gameMode === 'intensity' && this.state.roundInfo?.min_intensity !== undefined && this.state.roundInfo?.max_intensity !== undefined) {
            uiManager.updateIntensityMeter(
                true,
                result.confidence,
                this.state.roundInfo.min_intensity,
                this.state.roundInfo.max_intensity
            );
        }
    }

    /**
     * Xử lý khi chế độ Intensity
     */
    private handleIntensityMode(result: ProcessFrameResponse): void {
        // Kiểm tra nếu đang duy trì cảm xúc trong khoảng cường độ mục tiêu
        if (result.in_intensity_range) {
            this.state.sustainedTime += this.frameInterval / 1000; // Chuyển đổi ms -> s
            
            // Kiểm tra xem đã duy trì đủ thời gian chưa
            const requiredTime = this.state.roundInfo?.sustain_time || 3;
            if (this.state.sustainedTime >= requiredTime) {
                this.handleRoundPassed();
                this.state.sustainedTime = 0;
            }
        } else {
            // Reset thời gian duy trì nếu ra khỏi khoảng mục tiêu
            this.state.sustainedTime = 0;
        }
    }

    /**
     * Xử lý khi vượt qua một vòng
     */
    private handleRoundPassed(): void {
        // Hiệu ứng thành công
        uiManager.showSuccessAnimation();
        
        // Tính điểm tùy theo chế độ chơi và thời gian còn lại
        let points = 10; // Điểm cơ bản cho mỗi vòng
        
        if (this.state.timeLeft > 0) {
            // Bonus điểm nếu còn thời gian
            points += Math.min(10, this.state.timeLeft);
        }
        
        this.state.score += points;
        
        // Chuyển sang vòng tiếp theo
        this.nextRound(true);
    }

    /**
     * Chuyển sang vòng tiếp theo
     */
    private async nextRound(success: boolean): Promise<void> {
        // Nếu thành công thì tăng số vòng
        if (success) {
            this.state.currentRound++;
        } else {
            // Nếu thất bại trong Time Attack, kết thúc game
            if (this.state.gameMode === 'time_attack') {
                this.completeGame();
                return;
            }
            // Với Emotion Master, kết thúc nếu thất bại
            if (this.state.gameMode === 'emotion_master') {
                this.completeGame();
                return;
            }
        }
        
        // Tiếp tục vòng mới
        await this.startRound();
    }

    /**
     * Hoàn thành game và hiển thị màn hình kết thúc
     */
    private completeGame(): void {
        // Dừng timer
        if (this.state.timerInterval !== null) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
        
        // Hiển thị màn hình kết thúc với điểm số
        uiManager.showEndScreen(this.state.score);
        
        // Đánh dấu game không còn active
        this.state.isGameActive = false;
    }

    /**
     * Kết thúc game và quay về màn hình chính
     */
    private endGame(): void {
        // Dừng timer
        if (this.state.timerInterval !== null) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }

        // Dừng xử lý frame
        this.state.frameProcessingActive = false;
        if (this.frameProcessingId !== null) {
            cancelAnimationFrame(this.frameProcessingId);
            this.frameProcessingId = null;
        }

        // Dừng camera stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        if (this.webcam) {
            this.webcam.srcObject = null;
        }

        // Đánh dấu game không còn active
        this.state.isGameActive = false;
    }

    /**
     * Gửi điểm số lên bảng xếp hạng
     */
    private async submitScore(playerName: string): Promise<void> {
        try {
            await submitScore(playerName, this.state.score, this.state.gameMode);
            alert(`Điểm số của ${playerName} đã được lưu thành công!`);
            // Tải lại bảng xếp hạng và hiển thị
            await this.loadLeaderboard(this.state.gameMode);
        } catch (error) {
            console.error('Error submitting score:', error);
            alert('Có lỗi xảy ra khi lưu điểm số. Vui lòng thử lại.');
        }
    }

    /**
     * Tải và hiển thị bảng xếp hạng
     */
    private async loadLeaderboard(gameMode?: string): Promise<void> {
        try {
            const response = await getLeaderboard(gameMode);
            uiManager.updateLeaderboard(response.leaderboard);
            uiManager.showScreen(SCREENS.LEADERBOARD);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            alert('Có lỗi xảy ra khi tải bảng xếp hạng. Vui lòng thử lại.');
        }
    }
}

// Export singleton instance
export const gameManager = new GameManager();
