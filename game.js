// ===== MAIN GAME CONTROLLER =====

class PoseMatchGame {
    constructor() {
        // Game configuration
        this.NUM_ROUNDS = 5;
        this.TIME_PER_ROUND = 8;
        this.COUNTDOWN_TIME = 3;
        
        // Game state
        this.currentPhase = 'login'; // login, game, end
        this.currentRound = 0;
        this.totalScore = 0;
        this.roundScore = 0;
        this.timeLeft = 0;
        this.gameTimer = null;
        this.countdownTimer = null;
        
        // Player data
        this.playerName = '';
        this.playerEmail = '';
        
        // Pose data
        this.poseSamples = [];
        this.currentPose = null;
        this.currentSimilarity = 0;
        this.lastPoseAngles = null;
        
        // MediaPipe & Camera
        this.poseProcessor = new PoseProcessor();
        this.camera = null;
        this.videoElement = null;
        this.canvas = null;
        this.ctx = null;
        
        // DOM elements
        this.initializeElements();
        
        // Event listeners
        this.setupEventListeners();
        
        // Initialize particles
        this.initializeParticles();
    }

    // Initialize DOM elements references
    initializeElements() {
        // Phases
        this.loginPhase = document.getElementById('loginPhase');
        this.gamePhase = document.getElementById('gamePhase');
        this.endPhase = document.getElementById('endPhase');
        
        // Login elements
        this.loginForm = document.getElementById('loginForm');
        this.playerNameInput = document.getElementById('playerName');
        this.playerEmailInput = document.getElementById('playerEmail');
        this.loadingScreen = document.getElementById('loadingScreen');
        
        // Game elements
        this.videoElement = document.getElementById('videoElement');
        this.canvas = document.getElementById('poseCanvas');
        this.ctx = this.canvas?.getContext('2d');
        this.currentRoundSpan = document.getElementById('currentRound');
        this.totalRoundsSpan = document.getElementById('totalRounds');
        this.timerText = document.getElementById('timerText');
        this.currentScoreSpan = document.getElementById('currentScore');
        this.targetPoseImage = document.getElementById('targetPoseImage');
        this.poseDifficulty = document.getElementById('poseDifficulty');
        this.similarityFill = document.getElementById('similarityFill');
        this.similarityText = document.getElementById('similarityText');
        this.scorePopup = document.getElementById('scorePopup');
        this.roundTransition = document.getElementById('roundTransition');
        
        // End elements
        this.finalScore = document.getElementById('finalScore');
        this.performanceRating = document.getElementById('performanceRating');
        this.leaderboard = document.getElementById('leaderboard');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.newPlayerBtn = document.getElementById('newPlayerBtn');
        this.confetti = document.getElementById('confetti');
        
        // Set total rounds
        if (this.totalRoundsSpan) {
            this.totalRoundsSpan.textContent = this.NUM_ROUNDS;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Login form
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // End screen buttons
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.restartGame());
        }
        
        if (this.newPlayerBtn) {
            this.newPlayerBtn.addEventListener('click', () => this.backToLogin());
        }
        
        // Add ripple effect to buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('start-btn') || e.target.classList.contains('action-btn')) {
                this.createRipple(e);
            }
        });
    }

    // Create ripple effect for buttons
    createRipple(event) {
        const button = event.target;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('div');
        ripple.className = 'btn-ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Initialize floating particles
    initializeParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createParticle();
            }, i * 200);
        }
    }

    // Create a floating particle
    createParticle() {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = Math.random() * 6 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '-1';
        particle.style.opacity = '0.6';
        
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight + 10;
        
        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';
        
        document.body.appendChild(particle);
        
        const duration = Math.random() * 10000 + 15000;
        const endY = -100;
        const drift = (Math.random() - 0.5) * 200;
        
        particle.animate([
            { transform: `translate(0px, 0px) rotate(0deg)`, opacity: 0.6 },
            { transform: `translate(${drift}px, ${endY - startY}px) rotate(360deg)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'linear'
        }).onfinish = () => {
            particle.remove();
            // Create new particle to maintain count
            if (this.currentPhase === 'login') {
                setTimeout(() => this.createParticle(), Math.random() * 5000);
            }
        };
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        const name = this.playerNameInput.value.trim();
        const email = this.playerEmailInput.value.trim();
        
        if (!name || !email) {
            this.showError('Vui lòng điền đầy đủ thông tin!');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showError('Email không hợp lệ!');
            return;
        }
        
        this.playerName = name;
        this.playerEmail = email;
        
        // Show loading screen
        this.loadingScreen.classList.add('active');
        
        try {
            // Initialize game systems
            await this.initializeGame();
            
            // Start game after loading
            setTimeout(() => {
                this.startGame();
            }, 3000);
            
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.showError('Không thể khởi tạo game. Vui lòng thử lại!');
            this.loadingScreen.classList.remove('active');
        }
    }

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show error message
    showError(message) {
        // Create error popup
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-popup';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-message">${message}</span>
            </div>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            z-index: 10000;
            animation: errorSlideIn 0.3s ease-out;
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            errorDiv.style.animation = 'errorSlideOut 0.3s ease-in forwards';
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    }

    // Initialize game systems
    async initializeGame() {
        console.log('Initializing game systems...');
        
        // Initialize MediaPipe
        const poseInitialized = await this.poseProcessor.initialize();
        if (!poseInitialized) {
            throw new Error('Failed to initialize MediaPipe Pose');
        }
        
        // Load pose samples
        this.poseSamples = await this.poseProcessor.loadAllPoseSamples();
        if (this.poseSamples.length === 0) {
            throw new Error('No pose samples available');
        }
        
        console.log(`Loaded ${this.poseSamples.length} pose samples`);
        
        // Initialize camera
        await this.initializeCamera();
        
        // Setup canvas
        this.setupCanvas();
        
        console.log('Game initialization complete');
    }

    // Initialize camera
    async initializeCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: 1280, 
                    height: 720,
                    facingMode: 'user'
                }
            });
            
            this.videoElement.srcObject = stream;
            
            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    resolve();
                };
            });
        } catch (error) {
            console.error('Camera initialization failed:', error);
            throw new Error('Không thể truy cập camera. Vui lòng cấp quyền camera!');
        }
    }

    // Setup canvas for pose overlay
    setupCanvas() {
        if (!this.canvas || !this.videoElement) return;
        
        const resizeCanvas = () => {
            this.canvas.width = this.videoElement.videoWidth || 1280;
            this.canvas.height = this.videoElement.videoHeight || 720;
        };
        
        this.videoElement.addEventListener('loadedmetadata', resizeCanvas);
        resizeCanvas();
    }

    // Start the game
    async startGame() {
        console.log('Starting game...');
        
        // Switch to game phase
        this.switchPhase('game');
        
        // Reset game state
        this.currentRound = 0;
        this.totalScore = 0;
        this.updateUI();
        
        // Start first round
        this.nextRound();
    }

    // Switch between phases
    switchPhase(newPhase) {
        // Remove active class from all phases
        document.querySelectorAll('.phase').forEach(phase => {
            phase.classList.remove('active');
        });
        
        // Add active class to new phase
        const phaseElement = document.getElementById(newPhase + 'Phase');
        if (phaseElement) {
            phaseElement.classList.add('active');
        }
        
        this.currentPhase = newPhase;
        
        // Phase-specific setup
        if (newPhase === 'game') {
            this.startPoseDetection();
        } else if (newPhase === 'end') {
            this.stopPoseDetection();
            this.showEndScreen();
        }
    }

    // Start next round
    nextRound() {
        this.currentRound++;
        
        if (this.currentRound > this.NUM_ROUNDS) {
            this.endGame();
            return;
        }
        
        // Select random pose
        this.currentPose = this.poseSamples[Math.floor(Math.random() * this.poseSamples.length)];
        
        // Update UI
        this.updateUI();
        this.updatePoseDisplay();
        
        // Show round transition
        this.showRoundTransition();
        
        // Start countdown
        setTimeout(() => {
            this.startCountdown();
        }, 2000);
    }

    // Show round transition
    showRoundTransition() {
        if (!this.roundTransition) return;
        
        const title = this.roundTransition.querySelector('.transition-title');
        const score = this.roundTransition.querySelector('.transition-score');
        
        if (title) title.textContent = `Round ${this.currentRound}`;
        if (score) score.textContent = `Score: ${this.totalScore}`;
        
        this.roundTransition.classList.add('show');
        
        setTimeout(() => {
            this.roundTransition.classList.remove('show');
        }, 2000);
    }

    // Start countdown before round
    startCountdown() {
        let countdown = this.COUNTDOWN_TIME;
        
        const countdownInterval = setInterval(() => {
            this.timerText.textContent = countdown;
            this.timerText.parentElement.classList.add('urgent');
            
            countdown--;
            
            if (countdown < 0) {
                clearInterval(countdownInterval);
                this.startRound();
            }
        }, 1000);
    }

    // Start round timer and pose detection
    startRound() {
        this.timeLeft = this.TIME_PER_ROUND;
        this.roundScore = 0;
        
        // Remove urgent class
        this.timerText.parentElement.classList.remove('urgent');
        
        // Start timer
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 3) {
                this.timerText.parentElement.classList.add('urgent');
            }
            
            if (this.timeLeft <= 0) {
                this.endRound();
            }
        }, 1000);
        
        // Reset similarity
        this.currentSimilarity = 0;
        this.updateSimilarityIndicator();
    }

    // End current round
    endRound() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        // Add round score to total
        this.totalScore += this.roundScore;
        
        // Show score popup
        this.showScorePopup(this.roundScore);
        
        // Continue to next round after delay
        setTimeout(() => {
            this.nextRound();
        }, 2000);
    }

    // End game
    endGame() {
        this.switchPhase('end');
    }

    // Update timer display
    updateTimer() {
        if (this.timerText) {
            this.timerText.textContent = this.timeLeft;
        }
    }

    // Update UI elements
    updateUI() {
        if (this.currentRoundSpan) {
            this.currentRoundSpan.textContent = this.currentRound;
        }
        
        if (this.currentScoreSpan) {
            this.currentScoreSpan.textContent = this.totalScore;
        }
    }

    // Update pose display
    updatePoseDisplay() {
        if (!this.currentPose) return;
        
        if (this.targetPoseImage) {
            this.targetPoseImage.src = this.currentPose.image;
            this.targetPoseImage.alt = this.currentPose.name;
        }
        
        if (this.poseDifficulty) {
            this.poseDifficulty.textContent = this.currentPose.difficulty;
            this.poseDifficulty.className = `pose-difficulty ${this.currentPose.difficulty.toLowerCase()}`;
        }
    }

    // Start pose detection loop
    startPoseDetection() {
        if (!this.videoElement || !this.poseProcessor.isInitialized) return;
        
        this.poseProcessor.pose.onResults((results) => {
            this.handlePoseResults(results);
        });
        
        // Start processing video frames
        const processFrame = async () => {
            if (this.currentPhase === 'game' && this.videoElement.readyState >= 2) {
                await this.poseProcessor.pose.send({ image: this.videoElement });
            }
            
            if (this.currentPhase === 'game') {
                requestAnimationFrame(processFrame);
            }
        };
        
        processFrame();
    }

    // Stop pose detection
    stopPoseDetection() {
        // Pose detection will stop automatically when phase changes
    }

    // Handle pose detection results
    handlePoseResults(results) {
        if (!results.poseLandmarks || !this.currentPose) {
            this.updateSimilarityIndicator(0, 'Đứng vào khung hình');
            return;
        }
        
        // Draw pose on canvas
        this.poseProcessor.drawPose(this.canvas, results.poseLandmarks, true);
        
        // Extract current pose angles
        const currentAngles = this.poseProcessor.extractPoseAngles(results.poseLandmarks);
        if (!currentAngles) return;
        
        // Compare with target pose
        const angleDifference = this.poseProcessor.comparePoseAngles(
            currentAngles, 
            this.currentPose.angles
        );
        
        // Calculate similarity percentage
        const similarity = this.poseProcessor.getSimilarityPercentage(angleDifference);
        const similarityText = this.poseProcessor.getSimilarityText(similarity);
        
        this.currentSimilarity = similarity;
        this.updateSimilarityIndicator(similarity, similarityText);
        
        // Award points based on similarity
        if (similarity >= 70) {
            const points = this.poseProcessor.getPoints(angleDifference);
            this.roundScore = Math.max(this.roundScore, points);
        }
        
        // Add visual feedback for good poses
        if (similarity >= 80) {
            document.querySelector('.camera-frame')?.classList.add('detecting');
        } else {
            document.querySelector('.camera-frame')?.classList.remove('detecting');
        }
    }

    // Update similarity indicator
    updateSimilarityIndicator(percentage = 0, text = 'Đứng vào khung hình') {
        if (this.similarityFill) {
            this.similarityFill.style.width = percentage + '%';
        }
        
        if (this.similarityText) {
            this.similarityText.textContent = text;
        }
    }

    // Show score popup
    showScorePopup(score) {
        if (!this.scorePopup) return;
        
        const scoreValue = this.scorePopup.querySelector('.score-value');
        const scoreLabel = this.scorePopup.querySelector('.score-label');
        
        if (scoreValue) scoreValue.textContent = `+${score}`;
        if (scoreLabel) scoreLabel.textContent = 'POINTS';
        
        this.scorePopup.classList.add('show');
        
        setTimeout(() => {
            this.scorePopup.classList.remove('show');
        }, 2000);
    }

    // Show end screen with results
    showEndScreen() {
        // Update final score
        if (this.finalScore) {
            // Animate score counting up
            this.animateCounter(this.finalScore, 0, this.totalScore, 2000);
        }
        
        // Update performance rating
        this.updatePerformanceRating();
        
        // Update leaderboard
        this.updateLeaderboard();
        
        // Show confetti if good score
        if (this.totalScore >= 40) {
            this.showConfetti();
        }
    }

    // Animate counter from start to end value
    animateCounter(element, start, end, duration) {
        if (!element) return;
        
        const startTime = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(start + (end - start) * progress);
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

    // Update performance rating
    updatePerformanceRating() {
        if (!this.performanceRating) return;
        
        const stars = this.performanceRating.querySelector('.rating-stars');
        const text = this.performanceRating.querySelector('.rating-text');
        
        const percentage = (this.totalScore / (this.NUM_ROUNDS * 10)) * 100;
        let starCount = 0;
        let rating = '';
        
        if (percentage >= 90) {
            starCount = 5;
            rating = 'Xuất sắc! 🏆';
        } else if (percentage >= 80) {
            starCount = 4;
            rating = 'Rất tốt! 🌟';
        } else if (percentage >= 70) {
            starCount = 3;
            rating = 'Tốt! 👍';
        } else if (percentage >= 60) {
            starCount = 2;
            rating = 'Ổn đấy! 😊';
        } else {
            starCount = 1;
            rating = 'Cần cải thiện! 💪';
        }
        
        if (stars) {
            stars.innerHTML = '⭐'.repeat(starCount) + '☆'.repeat(5 - starCount);
        }
        
        if (text) {
            text.textContent = rating;
        }
    }

    // Update leaderboard
    updateLeaderboard() {
        if (!this.leaderboard) return;
        
        // Get existing scores from localStorage
        const scores = JSON.parse(localStorage.getItem('poseGameScores') || '[]');
        
        // Add current score
        scores.push({
            name: this.playerName,
            email: this.playerEmail,
            score: this.totalScore,
            date: new Date().toLocaleDateString('vi-VN')
        });
        
        // Sort by score (descending) and keep top 10
        scores.sort((a, b) => b.score - a.score);
        scores.splice(10);
        
        // Save back to localStorage
        localStorage.setItem('poseGameScores', JSON.stringify(scores));
        
        // Display leaderboard
        this.leaderboard.innerHTML = scores.map((entry, index) => `
            <div class="leaderboard-item" style="animation-delay: ${index * 0.1}s">
                <div class="rank-info">
                    <span class="rank">#${index + 1}</span>
                    <span class="name">${entry.name}</span>
                </div>
                <div class="score-info">
                    <span class="score">${entry.score}</span>
                    <span class="date">${entry.date}</span>
                </div>
            </div>
        `).join('');
    }

    // Show confetti animation
    showConfetti() {
        if (!this.confetti) return;
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const piece = document.createElement('div');
                piece.className = 'confetti-piece';
                piece.style.left = Math.random() * 100 + '%';
                piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                piece.style.animationDelay = Math.random() * 3 + 's';
                
                this.confetti.appendChild(piece);
                
                setTimeout(() => {
                    piece.remove();
                }, 3000);
            }, i * 50);
        }
    }

    // Restart game with same player
    restartGame() {
        this.currentRound = 0;
        this.totalScore = 0;
        this.roundScore = 0;
        
        this.switchPhase('game');
        this.nextRound();
    }

    // Back to login screen
    backToLogin() {
        // Reset game state
        this.currentRound = 0;
        this.totalScore = 0;
        this.roundScore = 0;
        this.playerName = '';
        this.playerEmail = '';
        
        // Clear form
        if (this.playerNameInput) this.playerNameInput.value = '';
        if (this.playerEmailInput) this.playerEmailInput.value = '';
        
        // Switch to login phase
        this.switchPhase('login');
        
        // Restart particles
        this.initializeParticles();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Pose Match Game...');
    
    // Add required CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes errorSlideIn {
            0% { transform: translateX(100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes errorSlideOut {
            0% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
        }
        
        .error-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .leaderboard-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .leaderboard-item:last-child {
            border-bottom: none;
        }
        
        .rank-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .rank {
            font-weight: bold;
            color: #4ecdc4;
            min-width: 30px;
        }
        
        .name {
            color: #ffffff;
        }
        
        .score-info {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        
        .score {
            font-weight: bold;
            color: #00ff88;
        }
        
        .date {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.6);
        }
        
        .pose-difficulty.easy { background: linear-gradient(135deg, #4ecdc4, #44a08d); }
        .pose-difficulty.medium { background: linear-gradient(135deg, #f093fb, #f5576c); }
        .pose-difficulty.hard { background: linear-gradient(135deg, #ff6b6b, #ee5a24); }
    `;
    document.head.appendChild(style);
    
    // Create game instance
    window.game = new PoseMatchGame();
    
    console.log('Pose Match Game initialized successfully!');
});
