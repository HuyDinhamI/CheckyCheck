// Game configuration
const CONFIG = {
    GAME_TIME: 10, // seconds
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    BALLOON_SPEED: 2,
    BALLOON_SPAWN_RATE: 0.02,
    HAND_DETECTION_CONFIDENCE: 0.8
};

// Game state
let gameState = {
    score: 0,
    timeLeft: CONFIG.GAME_TIME,
    isPlaying: false,
    balloons: [],
    handPosition: null,
    handLandmarks: null,
    gameStartTime: null,
    animationId: null
};

// Hand images and state
const handImages = {
    open: new Image(),
    closed: new Image()
};

let currentHandState = 'open';
let handStateSmoothing = 0;

// Hand configuration
const HAND_CONFIG = {
    imageSize: { width: 25, height: 25 },
    sensitivity: 3, // Số ngón để detect "open"
    smoothingThreshold: 5, // Frames to smooth state changes
    showDebug: false // Show landmarks overlay
};

// Balloon types (same as Python version)
const BALLOON_TYPES = {
    love: { points: 10, color: '#ff69b4', emoji: '💕', size: 60 },
    graduation: { points: 20, color: '#ffd700', emoji: '🎓', size: 55 },
    house: { points: 10, color: '#8fbc8f', emoji: '🏠', size: 65 },
    car: { points: 10, color: '#4169e1', emoji: '🚗', size: 65 },
    bomb: { points: -25, color: '#ff4500', emoji: '💣', size: 55 }
};

// DOM elements
const elements = {
    canvas: null,
    ctx: null,
    video: null,
    cameraPreview: null,
    permissionScreen: null,
    countdownScreen: null,
    gameOverScreen: null,
    loadingScreen: null,
    startBtn: null,
    restartBtn: null,
    scoreDisplay: null,
    timerDisplay: null,
    countdownNumber: null,
    finalScore: null
};

// MediaPipe Hands
let hands = null;
let camera = null;

// Initialize game
function init() {
    // Get DOM elements
    elements.canvas = document.getElementById('game-canvas');
    elements.ctx = elements.canvas.getContext('2d');
    elements.video = document.getElementById('video');
    elements.cameraPreview = document.getElementById('camera-preview');
    elements.permissionScreen = document.getElementById('permission-screen');
    elements.countdownScreen = document.getElementById('countdown-screen');
    elements.gameOverScreen = document.getElementById('game-over-screen');
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.startBtn = document.getElementById('start-btn');
    elements.restartBtn = document.getElementById('restart-btn');
    elements.scoreDisplay = document.getElementById('score');
    elements.timerDisplay = document.getElementById('timer');
    elements.countdownNumber = document.getElementById('countdown-number');
    elements.finalScore = document.getElementById('final-score');

    // Load hand images
    loadHandImages();

    // Setup canvas
    setupCanvas();

    // Event listeners
    elements.startBtn.addEventListener('click', startGame);
    elements.restartBtn.addEventListener('click', restartGame);

    // Handle window resize
    window.addEventListener('resize', setupCanvas);
}

// Load hand images
function loadHandImages() {
    handImages.open.src = 'open.png';
    handImages.closed.src = 'close.png';
    
    handImages.open.onload = () => console.log('Open hand image loaded');
    handImages.closed.onload = () => console.log('Closed hand image loaded');
    
    handImages.open.onerror = () => console.error('Failed to load open.png');
    handImages.closed.onerror = () => console.error('Failed to load close.png');
}

function setupCanvas() {
    elements.canvas.width = window.innerWidth;
    elements.canvas.height = window.innerHeight;
    CONFIG.CANVAS_WIDTH = window.innerWidth;
    CONFIG.CANVAS_HEIGHT = window.innerHeight;
}

// MediaPipe setup
async function setupHandTracking() {
    try {
        // Get camera stream for preview
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        
        // Set up preview video
        elements.cameraPreview.srcObject = stream;
        elements.cameraPreview.classList.remove('hidden');
        
        // Initialize MediaPipe Hands
        hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: CONFIG.HAND_DETECTION_CONFIDENCE,
            minTrackingConfidence: 0.5
        });

        hands.onResults(onHandResults);

        // Setup camera for MediaPipe
        camera = new Camera(elements.video, {
            onFrame: async () => {
                await hands.send({ image: elements.video });
            },
            width: 640,
            height: 480
        });

        await camera.start();
        return true;
    } catch (error) {
        console.error('Hand tracking setup failed:', error);
        return false;
    }
}

function onHandResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const hand = results.multiHandLandmarks[0];
        const indexFinger = hand[8]; // Index finger tip
        
        gameState.handPosition = {
            x: indexFinger.x * CONFIG.CANVAS_WIDTH,
            y: indexFinger.y * CONFIG.CANVAS_HEIGHT
        };
        
        // Store full hand landmarks for drawing
        gameState.handLandmarks = hand.map(landmark => ({
            x: landmark.x * CONFIG.CANVAS_WIDTH,
            y: landmark.y * CONFIG.CANVAS_HEIGHT
        }));
    } else {
        gameState.handPosition = null;
        gameState.handLandmarks = null;
    }
}

// Game functions
async function startGame() {
    showScreen('loading');
    
    const handTrackingReady = await setupHandTracking();
    
    if (!handTrackingReady) {
        alert('Không thể khởi động camera. Vui lòng thử lại!');
        showScreen('permission');
        return;
    }

    await countdown();
    initGame();
}

function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });

    // Show specific screen
    switch (screenName) {
        case 'permission':
            elements.permissionScreen.classList.remove('hidden');
            break;
        case 'countdown':
            elements.countdownScreen.classList.remove('hidden');
            break;
        case 'game-over':
            elements.gameOverScreen.classList.remove('hidden');
            break;
        case 'loading':
            elements.loadingScreen.classList.remove('hidden');
            break;
        case 'game':
            // Hide all screens to show game
            break;
    }
}

async function countdown() {
    showScreen('countdown');
    
    for (let i = 3; i > 0; i--) {
        elements.countdownNumber.textContent = i;
        playSound('countdown'); // We'll implement this later
        await sleep(1000);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function initGame() {
    // Reset game state
    gameState.score = 0;
    gameState.timeLeft = CONFIG.GAME_TIME;
    gameState.isPlaying = true;
    gameState.balloons = [];
    gameState.gameStartTime = Date.now();

    // Show game
    showScreen('game');
    
    // Start game loop
    gameLoop();
    
    // Start timer
    startTimer();
}

function gameLoop() {
    if (!gameState.isPlaying) return;

    // Clear canvas
    elements.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Spawn balloons
    if (Math.random() < CONFIG.BALLOON_SPAWN_RATE) {
        spawnBalloon();
    }

    // Update balloons
    updateBalloons();

    // Draw balloons
    drawBalloons();

    // Draw hand cursor
    drawHandCursor();

    // Check collisions
    checkCollisions();

    // Continue game loop
    gameState.animationId = requestAnimationFrame(gameLoop);
}

function spawnBalloon() {
    const types = Object.keys(BALLOON_TYPES);
    let type = types[Math.floor(Math.random() * types.length)];
    
    // Reduce graduation balloon frequency (like Python version)
    if (type === 'graduation' && Math.random() < 0.5) {
        type = types[Math.floor(Math.random() * types.length)];
    }

    const balloon = {
        id: Date.now() + Math.random(),
        type: type,
        x: Math.random() * (CONFIG.CANVAS_WIDTH - 100) + 50,
        y: CONFIG.CANVAS_HEIGHT + 50,
        size: BALLOON_TYPES[type].size,
        speed: CONFIG.BALLOON_SPEED + Math.random() * 2,
        ...BALLOON_TYPES[type]
    };

    gameState.balloons.push(balloon);
}

function updateBalloons() {
    gameState.balloons.forEach((balloon, index) => {
        balloon.y -= balloon.speed;

        // Remove balloons that are off screen
        if (balloon.y < -balloon.size) {
            gameState.balloons.splice(index, 1);
        }
    });
}

function drawBalloons() {
    gameState.balloons.forEach(balloon => {
        elements.ctx.font = `${balloon.size}px Arial`;
        elements.ctx.textAlign = 'center';
        
        // Add glow effect
        elements.ctx.shadowColor = balloon.color;
        elements.ctx.shadowBlur = 10;
        
        elements.ctx.fillText(balloon.emoji, balloon.x, balloon.y);
        
        // Reset shadow
        elements.ctx.shadowBlur = 0;
    });
}

function drawHandCursor() {
    // Draw hand image based on gesture only
    drawHandImage();
    
    // Remove red dot cursor - no longer needed with hand image
}

// Detect hand gesture (open/closed)
function detectHandGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) return 'open';
    
    const fingers = [];
    
    // Thumb - check if tip is to the right of joint (for right hand)
    const thumbTip = landmarks[4];
    const thumbJoint = landmarks[3];
    if (thumbTip.x > thumbJoint.x) {
        fingers.push(1);
    } else {
        fingers.push(0);
    }
    
    // Other 4 fingers - check if tip is above PIP joint
    const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky
    const fingerPips = [6, 10, 14, 18]; // PIP joints
    
    for (let i = 0; i < 4; i++) {
        const tip = landmarks[fingerTips[i]];
        const pip = landmarks[fingerPips[i]];
        
        if (tip.y < pip.y) {
            fingers.push(1); // Finger extended
        } else {
            fingers.push(0); // Finger folded
        }
    }
    
    // Count extended fingers
    const extendedFingers = fingers.reduce((sum, finger) => sum + finger, 0);
    
    // Return gesture based on extended fingers
    return extendedFingers >= HAND_CONFIG.sensitivity ? 'open' : 'closed';
}

// Draw hand image
function drawHandImage() {
    if (!gameState.handLandmarks) return;
    
    // Detect current gesture
    const detectedGesture = detectHandGesture(gameState.handLandmarks);
    
    // Smooth state transitions
    if (detectedGesture !== currentHandState) {
        handStateSmoothing++;
        if (handStateSmoothing >= HAND_CONFIG.smoothingThreshold) {
            currentHandState = detectedGesture;
            handStateSmoothing = 0;
        }
    } else {
        handStateSmoothing = Math.max(0, handStateSmoothing - 1);
    }
    
    // Get hand center (wrist position)
    const wrist = gameState.handLandmarks[0];
    const image = handImages[currentHandState];
    
    // Calculate dynamic size based on hand size
    const handBounds = getHandBounds(gameState.handLandmarks);
    const handSize = Math.max(handBounds.width, handBounds.height);
    const imageSize = Math.max(HAND_CONFIG.imageSize.width, handSize * 0.8);
    
    // Draw image if loaded
    if (image && image.complete) {
        // Draw hand image centered on wrist without any effects for transparency
        elements.ctx.drawImage(
            image,
            wrist.x - imageSize / 2,
            wrist.y - imageSize / 2,
            imageSize,
            imageSize
        );
    }
    
    // Debug: show landmarks if enabled
    if (HAND_CONFIG.showDebug) {
        drawHandSkeleton();
    }
}

// Get hand bounding box
function getHandBounds(landmarks) {
    let minX = landmarks[0].x, maxX = landmarks[0].x;
    let minY = landmarks[0].y, maxY = landmarks[0].y;
    
    landmarks.forEach(landmark => {
        minX = Math.min(minX, landmark.x);
        maxX = Math.max(maxX, landmark.x);
        minY = Math.min(minY, landmark.y);
        maxY = Math.max(maxY, landmark.y);
    });
    
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

function drawHandSkeleton() {
    if (!gameState.handLandmarks) return;
    
    const landmarks = gameState.handLandmarks;
    const ctx = elements.ctx;
    
    // Hand connections (MediaPipe hand model)
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17] // Palm connections
    ];
    
    // Draw connections (hand skeleton)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 5;
    
    connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
            ctx.beginPath();
            ctx.moveTo(landmarks[start].x, landmarks[start].y);
            ctx.lineTo(landmarks[end].x, landmarks[end].y);
            ctx.stroke();
        }
    });
    
    // Draw landmarks (hand joints)
    ctx.fillStyle = 'rgba(255, 107, 107, 0.8)';
    ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
    ctx.shadowBlur = 10;
    
    landmarks.forEach((landmark, index) => {
        ctx.beginPath();
        
        // Make finger tips larger
        const isFingerTip = [4, 8, 12, 16, 20].includes(index);
        const radius = isFingerTip ? 8 : 5;
        
        ctx.arc(landmark.x, landmark.y, radius, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

function checkCollisions() {
    if (!gameState.handPosition) return;

    const { x: handX, y: handY } = gameState.handPosition;

    gameState.balloons.forEach((balloon, index) => {
        const distance = Math.sqrt(
            Math.pow(handX - balloon.x, 2) + Math.pow(handY - balloon.y, 2)
        );

        if (distance < balloon.size / 2 + 15) {
            // Collision detected
            popBalloon(balloon, index);
        }
    });
}

function popBalloon(balloon, index) {
    // Force hand to closed state for grab effect
    currentHandState = 'closed';
    handStateSmoothing = 0;
    
    // Reset back to normal after short delay
    setTimeout(() => {
        handStateSmoothing = 0;
    }, 200);

    // Update score
    gameState.score += balloon.points;
    updateScore();

    // Show floating score
    showFloatingScore(balloon.x, balloon.y, balloon.points);

    // Play sound effect
    playSound(balloon.type);

    // Remove balloon
    gameState.balloons.splice(index, 1);

    // Add pop animation
    createPopEffect(balloon.x, balloon.y);
}

function showFloatingScore(x, y, points) {
    const scoreElement = document.createElement('div');
    scoreElement.className = 'floating-score' + (points < 0 ? ' negative' : '');
    scoreElement.textContent = points > 0 ? `+${points}` : points;
    scoreElement.style.left = x + 'px';
    scoreElement.style.top = y + 'px';
    
    document.getElementById('game-container').appendChild(scoreElement);
    
    // Remove after animation
    setTimeout(() => {
        scoreElement.remove();
    }, 1000);
}

function createPopEffect(x, y) {
    // Simple particle effect
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.background = '#fff';
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '6';
        
        const angle = (Math.PI * 2 * i) / 10;
        const velocity = 50 + Math.random() * 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        particle.style.animation = `particle-explode 0.5s ease-out forwards`;
        particle.style.setProperty('--vx', vx + 'px');
        particle.style.setProperty('--vy', vy + 'px');
        
        document.getElementById('game-container').appendChild(particle);
        
        setTimeout(() => particle.remove(), 500);
    }
}

function updateScore() {
    elements.scoreDisplay.textContent = `Điểm: ${gameState.score}`;
}

function updateTimer() {
    elements.timerDisplay.textContent = `Thời gian: ${gameState.timeLeft}`;
}

function startTimer() {
    const timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimer();

        if (gameState.timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameState.isPlaying = false;
    
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
    }

    // Show final score
    elements.finalScore.textContent = `Điểm của bạn: ${gameState.score}`;
    showScreen('game-over');

    // Stop camera
    if (camera) {
        camera.stop();
    }
}

function restartGame() {
    startGame();
}

// Sound effects (placeholder - you can add actual sound files later)
function playSound(type) {
    // For now, we'll use Web Audio API to create simple beeps
    // You can replace this with actual sound files later
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different balloon types
    const frequencies = {
        love: 800,
        graduation: 1000,
        house: 600,
        car: 700,
        bomb: 200,
        countdown: 440
    };

    oscillator.frequency.setValueAtTime(frequencies[type] || 440, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Add CSS for particle animation
const style = document.createElement('style');
style.textContent = `
@keyframes particle-explode {
    0% {
        transform: translate(0, 0);
        opacity: 1;
    }
    100% {
        transform: translate(var(--vx, 0), var(--vy, 0));
        opacity: 0;
    }
}
`;
document.head.appendChild(style);

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', init);

// Handle visibility change to pause game
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState.isPlaying) {
        // Pause game logic here if needed
    }
});
