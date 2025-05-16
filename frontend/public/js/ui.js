/**
 * Module quản lý giao diện người dùng
 */
// Các màn hình
export const SCREENS = {
    WELCOME: 'welcome-screen',
    GAME: 'game-screen',
    END: 'end-screen',
    LEADERBOARD: 'leaderboard-screen'
};
// Class chính quản lý UI
export class UIManager {
    constructor() {
        this.activeScreen = SCREENS.WELCOME;
        this.eventListeners = {};
        // Khởi tạo các tham chiếu đến DOM elements
        this.elements = {
            screens: {
                welcomeScreen: document.getElementById(SCREENS.WELCOME),
                gameScreen: document.getElementById(SCREENS.GAME),
                endScreen: document.getElementById(SCREENS.END),
                leaderboardScreen: document.getElementById(SCREENS.LEADERBOARD)
            },
            buttons: {
                gameModes: document.querySelectorAll('.game-mode'),
                leaderboardBtn: document.querySelector('.leaderboard-btn'),
                backBtn: document.getElementById('back-btn'),
                leaderboardBackBtn: document.getElementById('leaderboard-back-btn'),
                submitScoreBtn: document.getElementById('submit-score-btn'),
                playAgainBtn: document.getElementById('play-again-btn'),
                menuBtn: document.getElementById('menu-btn')
            },
            game: {
                webcam: document.getElementById('webcam'),
                canvas: document.getElementById('canvas'),
                faceBox: document.getElementById('face-box'),
                targetEmotion: document.getElementById('target-emotion'),
                detectedEmotion: document.getElementById('detected-emotion'),
                confidenceLevel: document.getElementById('confidence-level'),
                timerValue: document.getElementById('timer-value'),
                roundNumber: document.getElementById('round-number'),
                intensityMeter: document.getElementById('intensity-meter'),
                targetZone: document.querySelector('.target-zone'),
                currentLevel: document.querySelector('.current-level')
            },
            leaderboard: {
                modeFilter: document.getElementById('leaderboard-mode-filter'),
                table: document.getElementById('leaderboard-table'),
                tableBody: document.getElementById('leaderboard-body')
            },
            end: {
                finalScore: document.getElementById('final-score'),
                playerNameInput: document.getElementById('player-name')
            }
        };
    }
    /**
     * Thêm event listener cho một element
     */
    on(eventName, callback) {
        this.eventListeners[eventName] = callback;
    }
    /**
     * Kích hoạt một event
     */
    trigger(eventName, ...args) {
        const callback = this.eventListeners[eventName];
        if (callback) {
            callback(...args);
        }
    }
    /**
     * Thiết lập các event listener cho UI
     */
    setupEventListeners() {
        // Game mode buttons
        this.elements.buttons.gameModes.forEach(btn => {
            btn.addEventListener('click', () => {
                const gameMode = btn.dataset.mode;
                if (gameMode) {
                    this.trigger('gameMode:selected', gameMode);
                }
            });
        });
        // Leaderboard button
        if (this.elements.buttons.leaderboardBtn) {
            this.elements.buttons.leaderboardBtn.addEventListener('click', () => {
                this.trigger('leaderboard:show');
            });
        }
        // Back buttons
        if (this.elements.buttons.backBtn) {
            this.elements.buttons.backBtn.addEventListener('click', () => {
                this.trigger('game:exit');
            });
        }
        if (this.elements.buttons.leaderboardBackBtn) {
            this.elements.buttons.leaderboardBackBtn.addEventListener('click', () => {
                this.showScreen(SCREENS.WELCOME);
            });
        }
        // End screen buttons
        if (this.elements.buttons.submitScoreBtn) {
            this.elements.buttons.submitScoreBtn.addEventListener('click', () => {
                var _a;
                const playerName = ((_a = this.elements.end.playerNameInput) === null || _a === void 0 ? void 0 : _a.value) || 'Anonymous';
                this.trigger('score:submit', playerName);
            });
        }
        if (this.elements.buttons.playAgainBtn) {
            this.elements.buttons.playAgainBtn.addEventListener('click', () => {
                this.trigger('game:restart');
            });
        }
        if (this.elements.buttons.menuBtn) {
            this.elements.buttons.menuBtn.addEventListener('click', () => {
                this.showScreen(SCREENS.WELCOME);
            });
        }
        // Leaderboard mode filter
        if (this.elements.leaderboard.modeFilter) {
            this.elements.leaderboard.modeFilter.addEventListener('change', (e) => {
                const target = e.target;
                this.trigger('leaderboard:filter', target.value);
            });
        }
    }
    /**
     * Hiển thị một màn hình cụ thể
     */
    showScreen(screenId) {
        // Ẩn tất cả các màn hình
        Object.values(this.elements.screens).forEach(screen => {
            screen === null || screen === void 0 ? void 0 : screen.classList.remove('active');
        });
        // Hiển thị màn hình được yêu cầu
        const screenToShow = document.getElementById(screenId);
        if (screenToShow) {
            screenToShow.classList.add('active');
            this.activeScreen = screenId;
        }
    }
    /**
     * Cập nhật thông tin vòng chơi
     */
    updateGameInfo(targetEmotion, round, timeLimit) {
        if (this.elements.game.targetEmotion) {
            this.elements.game.targetEmotion.textContent = targetEmotion;
        }
        if (this.elements.game.roundNumber) {
            this.elements.game.roundNumber.textContent = String(round + 1);
        }
        if (this.elements.game.timerValue) {
            this.elements.game.timerValue.textContent = String(timeLimit);
        }
    }
    /**
     * Cập nhật hiển thị cảm xúc nhận diện được
     */
    updateDetectedEmotion(emotion, confidence) {
        if (this.elements.game.detectedEmotion) {
            this.elements.game.detectedEmotion.textContent = emotion;
        }
        if (this.elements.game.confidenceLevel) {
            this.elements.game.confidenceLevel.textContent = `${Math.round(confidence * 100)}%`;
        }
    }
    /**
     * Cập nhật hộp khuôn mặt
     */
    updateFaceBox(faceBox) {
        const faceBoxElement = this.elements.game.faceBox;
        if (!faceBoxElement)
            return;
        if (faceBox) {
            faceBoxElement.style.display = 'block';
            faceBoxElement.style.left = `${faceBox.x}px`;
            faceBoxElement.style.top = `${faceBox.y}px`;
            faceBoxElement.style.width = `${faceBox.width}px`;
            faceBoxElement.style.height = `${faceBox.height}px`;
        }
        else {
            faceBoxElement.style.display = 'none';
        }
    }
    /**
     * Cập nhật đồng hồ đếm ngược
     */
    updateTimer(seconds) {
        if (this.elements.game.timerValue) {
            this.elements.game.timerValue.textContent = String(seconds);
        }
    }
    /**
     * Hiệu ứng thành công khi nhận diện đúng cảm xúc
     */
    showSuccessAnimation() {
        const cameraContainer = document.querySelector('.camera-container');
        if (cameraContainer) {
            cameraContainer.classList.add('success-animation');
            setTimeout(() => {
                cameraContainer.classList.remove('success-animation');
            }, 1000);
        }
    }
    /**
     * Cập nhật thanh đo cường độ (cho chế độ Intensity)
     */
    updateIntensityMeter(visible, currentValue = 0, minThreshold = 0, maxThreshold = 1) {
        const intensityMeter = this.elements.game.intensityMeter;
        const targetZone = this.elements.game.targetZone;
        const currentLevel = this.elements.game.currentLevel;
        if (!intensityMeter || !targetZone || !currentLevel)
            return;
        intensityMeter.style.display = visible ? 'block' : 'none';
        if (visible) {
            // Cập nhật vùng mục tiêu
            const leftPos = minThreshold * 100;
            const width = (maxThreshold - minThreshold) * 100;
            targetZone.style.left = `${leftPos}%`;
            targetZone.style.width = `${width}%`;
            // Cập nhật mức hiện tại
            currentLevel.style.left = `${currentValue * 100}%`;
        }
    }
    /**
     * Hiển thị màn hình kết thúc với điểm số
     */
    showEndScreen(score) {
        if (this.elements.end.finalScore) {
            this.elements.end.finalScore.textContent = String(score);
        }
        this.showScreen(SCREENS.END);
    }
    /**
     * Cập nhật bảng xếp hạng
     */
    updateLeaderboard(entries) {
        const tableBody = this.elements.leaderboard.tableBody;
        if (!tableBody)
            return;
        // Xóa nội dung cũ
        tableBody.innerHTML = '';
        // Thêm các hàng mới
        entries.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.player_name}</td>
                <td>${entry.score}</td>
                <td>${entry.game_mode}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    /**
     * Chuẩn bị màn hình chơi game cho một chế độ cụ thể
     */
    prepareGameScreen(gameMode) {
        // Ẩn/hiện các thành phần tùy theo chế độ chơi
        const intensityMeter = this.elements.game.intensityMeter;
        if (intensityMeter) {
            intensityMeter.style.display = gameMode === 'intensity' ? 'block' : 'none';
        }
        this.showScreen(SCREENS.GAME);
    }
}
// Export singleton instance
export const uiManager = new UIManager();
//# sourceMappingURL=ui.js.map