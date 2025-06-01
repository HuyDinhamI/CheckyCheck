// Main application controller
class CheckyCheckApp {
    constructor() {
        this.currentScreen = 'landing-page';
        this.game = null;
        this.camera = null;
        
        this.init();
    }
    
    init() {
        console.log('🎭 CheckyCheck App Initializing...');
        this.setupEventListeners();
        this.showScreen('landing-page');
    }
    
    setupEventListeners() {
        // Landing page buttons
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('instructions-btn').addEventListener('click', () => {
            this.showInstructions();
        });
        
        // Instructions modal
        const modal = document.getElementById('instructions-modal');
        const closeBtn = modal.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            this.hideInstructions();
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.hideInstructions();
            }
        });
        
        // Game controls
        document.getElementById('skip-level-btn').addEventListener('click', () => {
            if (this.game) this.game.skipLevel();
        });
        
        document.getElementById('quit-game-btn').addEventListener('click', () => {
            this.quitGame();
        });
        
        // Level complete
        document.getElementById('next-level-btn').addEventListener('click', () => {
            if (this.game) this.game.nextLevel();
        });
        
        // Victory screen
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('home-btn').addEventListener('click', () => {
            this.goHome();
        });
        
        // Game over screen
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('home-btn-2').addEventListener('click', () => {
            this.goHome();
        });
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active', 'fade-in');
            this.currentScreen = screenId;
        }
    }
    
    showInstructions() {
        document.getElementById('instructions-modal').style.display = 'block';
    }
    
    hideInstructions() {
        document.getElementById('instructions-modal').style.display = 'none';
    }
    
    async startGame() {
        console.log('🎮 Starting new game...');
        
        try {
            // Initialize camera first
            this.camera = new CameraHandler();
            await this.camera.init();
            
            // Initialize game
            this.game = new EmotionGame(this);
            await this.game.init();
            
            // Show game screen
            this.showScreen('game-screen');
            
            // Start the game
            this.game.start();
            
        } catch (error) {
            console.error('Error starting game:', error);
            alert('Không thể khởi tạo camera hoặc game. Vui lòng kiểm tra quyền truy cập camera và thử lại.');
        }
    }
    
    quitGame() {
        if (confirm('Bạn có chắc muốn thoát game?')) {
            this.cleanupGame();
            this.goHome();
        }
    }
    
    goHome() {
        this.cleanupGame();
        this.showScreen('landing-page');
    }
    
    cleanupGame() {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        
        if (this.camera) {
            this.camera.destroy();
            this.camera = null;
        }
    }
    
    // Game event handlers
    onLevelComplete(level, score) {
        console.log(`Level ${level} completed with score: ${score}%`);
        document.getElementById('completed-level').textContent = level;
        document.getElementById('level-final-score').textContent = Math.round(score);
        this.showScreen('level-complete-screen');
    }
    
    onGameComplete(stats) {
        console.log('Game completed!', stats);
        
        // Show final stats
        const statsContainer = document.getElementById('final-stats');
        statsContainer.innerHTML = `
            <h3>Kết quả cuối cùng:</h3>
            <div class="stat-item">
                <span>Tổng thời gian: ${Math.round(stats.totalTime / 1000)}s</span>
            </div>
            <div class="stat-item">
                <span>Điểm trung bình: ${Math.round(stats.averageScore)}%</span>
            </div>
            <div class="stat-item">
                <span>Màn khó nhất: ${stats.hardestLevel}</span>
            </div>
        `;
        
        this.showScreen('victory-screen');
    }
    
    onGameOver() {
        console.log('Game over');
        this.showScreen('game-over-screen');
    }
}

// Utility functions
const utils = {
    // Emotion mappings
    emotionIcons: {
        'angry': '😠',
        'disgusted': '🤢',
        'fearful': '😨',
        'happy': '😊',
        'neutral': '😐',
        'sad': '😢',
        'surprised': '😲'
    },
    
    emotionNames: {
        'angry': 'Tức giận',
        'disgusted': 'Ghê tởm',
        'fearful': 'Sợ hãi',
        'happy': 'Vui vẻ',
        'neutral': 'Bình thường',
        'sad': 'Buồn',
        'surprised': 'Ngạc nhiên'
    },
    
    // Get random emotions for game
    getRandomEmotions(count = 3) {
        const emotions = Object.keys(this.emotionNames);
        const shuffled = emotions.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },
    
    // Format time
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${remainingSeconds}s`;
    },
    
    // Smooth number animation
    animateNumber(element, start, end, duration = 1000) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * progress;
            element.textContent = Math.round(current);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.checkyApp = new CheckyCheckApp();
});

// Handle window beforeunload
window.addEventListener('beforeunload', () => {
    if (window.checkyApp) {
        window.checkyApp.cleanupGame();
    }
});
