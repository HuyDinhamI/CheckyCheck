// Main game logic class
class EmotionGame {
    constructor(app) {
        this.app = app;
        this.emotionAPI = new EmotionAPI();
        this.faceOverlay = new FaceOverlayManager();
        
        // Game state
        this.currentLevel = 0;
        this.levels = [];
        this.isPlaying = false;
        this.isPaused = false;
        
        // Scoring
        this.currentScore = 0;
        this.targetEmotion = null;
        this.sustainedFrames = 0;
        this.requiredFrames = 60; // Will be dynamically set based on level
        this.threshold = 60; // Changed from 70 to 60
        
        // Statistics
        this.gameStats = {
            startTime: null,
            levelScores: [],
            totalTime: 0,
            averageScore: 0,
            hardestLevel: null
        };
        
        // UI elements
        this.progressFill = null;
        this.progressLabel = null;
        this.currentScoreElement = null;
        this.emotionScoresContainer = null;
        this.levelInfo = null;
        this.targetEmotionText = null;
        this.targetEmotionIcon = null;
        
        // Frame processing
        this.lastPredictionTime = 0;
        this.predictionInterval = 100; // Predict every 100ms to reduce server load
    }
    
    // Get required frames based on level: Level 1=2s, Level 2=3s, Level 3=4s
    getRequiredFrames(level) {
        const baseDuration = 2; // 2 seconds for level 1
        const duration = baseDuration + level; // +1 second per level
        return duration * 30; // Convert to frames (assuming 30fps)
    }
    
    async init() {
        console.log('🎮 Initializing game...');
        
        // Check server health
        const serverReady = await this.emotionAPI.checkServerHealth();
        if (!serverReady) {
            throw new Error('Server không sẵn sàng. Vui lòng kiểm tra server backend.');
        }
        
        // Initialize face overlay
        this.faceOverlay.init();
        
        // Get UI elements
        this.initUIElements();
        
        // Generate random levels
        this.generateLevels();
        
        console.log('✅ Game initialized successfully');
    }
    
    initUIElements() {
        this.progressFill = document.getElementById('progress-fill');
        this.progressLabel = document.getElementById('progress-label');
        this.currentScoreElement = document.getElementById('current-score');
        this.emotionScoresContainer = document.getElementById('emotion-scores');
        this.levelInfo = document.getElementById('current-level');
        this.targetEmotionText = document.getElementById('target-emotion-text');
        this.targetEmotionIcon = document.getElementById('target-emotion-icon');
    }
    
    generateLevels() {
        // Temporary: Set all levels to "happy" for testing
        this.levels = ['happy', 'happy', 'happy'];
        console.log('🎯 Generated levels (TEST MODE):', this.levels);
    }
    
    start() {
        console.log('🚀 Starting game...');
        
        this.gameStats.startTime = Date.now();
        this.isPlaying = true;
        this.currentLevel = 0;
        
        // Start first level
        this.startLevel();
        
        // Start camera capture
        this.app.camera.startCapture((imageData) => {
            this.onCameraFrame(imageData);
        });
    }
    
    startLevel() {
        if (this.currentLevel >= this.levels.length) {
            this.completeGame();
            return;
        }
        
        this.targetEmotion = this.levels[this.currentLevel];
        this.currentScore = 0;
        this.sustainedFrames = 0;
        
        // Set required frames based on current level
        this.requiredFrames = this.getRequiredFrames(this.currentLevel);
        
        console.log(`🎯 Starting level ${this.currentLevel + 1}: ${this.targetEmotion} (${this.requiredFrames/30}s duration)`);
        
        // Update UI
        this.updateLevelUI();
        this.updateScoreUI();
        this.updateProgressUI();
        this.createEmotionScoresUI();
        
        // Reset face overlay color
        this.faceOverlay.setOverlayColor('#00ff00');
    }
    
    updateLevelUI() {
        this.levelInfo.textContent = `Màn ${this.currentLevel + 1}/3 (Giữ ${this.requiredFrames/30}s)`;
        this.targetEmotionText.textContent = utils.emotionNames[this.targetEmotion];
        this.targetEmotionIcon.textContent = utils.emotionIcons[this.targetEmotion];
    }
    
    updateScoreUI() {
        this.currentScoreElement.textContent = `${Math.round(this.currentScore)}%`;
    }
    
    updateProgressUI() {
        const progressPercent = Math.min(100, Math.max(0, this.currentScore));
        this.progressFill.style.width = `${progressPercent}%`;
        
        // Update progress color and label
        if (progressPercent >= this.threshold) {
            this.progressFill.classList.add('success');
            const remainingTime = ((this.requiredFrames - this.sustainedFrames) / 30).toFixed(1);
            this.progressLabel.textContent = `Tuyệt vời! Giữ nguyên... (${remainingTime}s)`;
            this.faceOverlay.setOverlayColor('#00ff00');
        } else {
            this.progressFill.classList.remove('success');
            this.progressLabel.textContent = `Hãy thể hiện cảm xúc: ${utils.emotionNames[this.targetEmotion]}`;
            this.faceOverlay.setOverlayColor('#ffaa00');
        }
    }
    
    createEmotionScoresUI() {
        this.emotionScoresContainer.innerHTML = '';
        
        const emotions = Object.keys(utils.emotionNames);
        emotions.forEach(emotion => {
            const scoreElement = document.createElement('div');
            scoreElement.className = `emotion-score ${emotion === this.targetEmotion ? 'target' : ''}`;
            scoreElement.innerHTML = `
                <span>${utils.emotionNames[emotion]}</span>
                <span id="score-${emotion}">0%</span>
            `;
            this.emotionScoresContainer.appendChild(scoreElement);
        });
    }
    
    updateEmotionScoresUI(emotions) {
        Object.keys(emotions).forEach(emotion => {
            const scoreElement = document.getElementById(`score-${emotion}`);
            if (scoreElement) {
                const score = Math.round(emotions[emotion] * 100);
                scoreElement.textContent = `${score}%`;
            }
        });
    }
    
    async onCameraFrame(imageData) {
        if (!this.isPlaying || this.isPaused) return;
        
        const now = Date.now();
        if (now - this.lastPredictionTime < this.predictionInterval) {
            return; // Skip frame to reduce server load
        }
        
        this.lastPredictionTime = now;
        
        try {
            // Predict emotion
            const result = await this.emotionAPI.predictEmotion(imageData);
            this.processEmotionResult(result);
            
        } catch (error) {
            console.error('Prediction error:', error);
            // Continue game even if some predictions fail
        }
    }
    
    processEmotionResult(result) {
        if (result.faces_detected === 0) {
            this.onNoFaceDetected();
            return;
        }
        
        const emotionData = result.emotions[0]; // Use first face
        const allEmotions = emotionData.all_emotions;
        
        // Update face overlay
        this.faceOverlay.updateOverlay([emotionData.face_position], this.app.camera.getVideoElement());
        
        // Update emotion scores UI
        this.updateEmotionScoresUI(allEmotions);
        
        // Calculate score for target emotion
        const targetScore = (allEmotions[this.targetEmotion] || 0) * 100;
        
        // Smooth score update
        this.currentScore = (this.currentScore * 0.7) + (targetScore * 0.3);
        
        // Update UI
        this.updateScoreUI();
        this.updateProgressUI();
        
        // Check level completion
        this.checkLevelCompletion();
    }
    
    onNoFaceDetected() {
        this.faceOverlay.hideOverlay();
        this.sustainedFrames = 0;
        this.progressLabel.textContent = 'Không phát hiện khuôn mặt. Hãy nhìn vào camera!';
        this.faceOverlay.setOverlayColor('#ff4444');
    }
    
    checkLevelCompletion() {
        if (this.currentScore >= this.threshold) {
            this.sustainedFrames++;
            
            if (this.sustainedFrames >= this.requiredFrames) {
                this.completeLevel();
            }
        } else {
            this.sustainedFrames = 0;
        }
    }
    
    completeLevel() {
        console.log(`✅ Level ${this.currentLevel + 1} completed!`);
        
        // Record level stats
        const levelTime = Date.now() - this.gameStats.startTime;
        this.gameStats.levelScores.push({
            level: this.currentLevel + 1,
            emotion: this.targetEmotion,
            score: this.currentScore,
            time: levelTime,
            duration: this.requiredFrames / 30
        });
        
        // Stop capture temporarily
        this.app.camera.stopCapture();
        
        // Show level complete screen
        this.app.onLevelComplete(this.currentLevel + 1, this.currentScore);
    }
    
    nextLevel() {
        this.currentLevel++;
        
        if (this.currentLevel >= this.levels.length) {
            this.completeGame();
        } else {
            // Return to game screen and start next level
            this.app.showScreen('game-screen');
            this.startLevel();
            
            // Resume capture
            this.app.camera.startCapture((imageData) => {
                this.onCameraFrame(imageData);
            });
        }
    }
    
    skipLevel() {
        if (confirm(`Bạn có chắc muốn bỏ qua màn ${this.currentLevel + 1}?`)) {
            // Record as failed level
            this.gameStats.levelScores.push({
                level: this.currentLevel + 1,
                emotion: this.targetEmotion,
                score: 0,
                time: Date.now() - this.gameStats.startTime,
                skipped: true,
                duration: this.requiredFrames / 30
            });
            
            this.nextLevel();
        }
    }
    
    completeGame() {
        console.log('🏆 Game completed!');
        
        // Calculate final stats
        this.gameStats.totalTime = Date.now() - this.gameStats.startTime;
        this.gameStats.averageScore = this.gameStats.levelScores.reduce((sum, level) => sum + level.score, 0) / this.gameStats.levelScores.length;
        
        // Find hardest level (lowest score)
        const hardestLevel = this.gameStats.levelScores.reduce((hardest, current) => 
            current.score < hardest.score ? current : hardest
        );
        this.gameStats.hardestLevel = `${hardestLevel.level} (${utils.emotionNames[hardestLevel.emotion]})`;
        
        // Stop capture
        this.app.camera.stopCapture();
        
        // Show victory screen
        this.app.onGameComplete(this.gameStats);
    }
    
    pause() {
        this.isPaused = true;
        this.app.camera.stopCapture();
        console.log('⏸️ Game paused');
    }
    
    resume() {
        this.isPaused = false;
        this.app.camera.startCapture((imageData) => {
            this.onCameraFrame(imageData);
        });
        console.log('▶️ Game resumed');
    }
    
    destroy() {
        console.log('🗑️ Destroying game...');
        
        this.isPlaying = false;
        this.isPaused = false;
        
        // Stop capture
        if (this.app.camera) {
            this.app.camera.stopCapture();
        }
        
        // Hide overlays
        this.faceOverlay.hideOverlay();
        
        console.log('✅ Game destroyed');
    }
}

// Game utilities and helpers
const gameUtils = {
    // Difficulty settings
    difficulties: {
        easy: { threshold: 60, sustainedTime: 2.0 },
        normal: { threshold: 65, sustainedTime: 2.5 },
        hard: { threshold: 70, sustainedTime: 3.0 }
    },
    
    // Emotion difficulty ranking (subjective)
    emotionDifficulty: {
        'happy': 1,
        'surprised': 2,
        'neutral': 3,
        'sad': 4,
        'angry': 5,
        'fearful': 6,
        'disgusted': 7
    },
    
    // Get emotion difficulty level
    getEmotionDifficulty(emotion) {
        return this.emotionDifficulty[emotion] || 5;
    },
    
    // Generate balanced level sequence
    generateBalancedLevels() {
        const emotions = Object.keys(utils.emotionNames);
        
        // Sort by difficulty
        emotions.sort((a, b) => this.getEmotionDifficulty(a) - this.getEmotionDifficulty(b));
        
        // Pick easy, medium, hard
        return [
            emotions[Math.floor(Math.random() * 3)], // Easy (0-2)
            emotions[3 + Math.floor(Math.random() * 2)], // Medium (3-4)
            emotions[5 + Math.floor(Math.random() * 2)]  // Hard (5-6)
        ];
    }
};
