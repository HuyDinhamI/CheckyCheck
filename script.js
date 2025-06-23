// Input Mode Management
class InputManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.mode = 'hand'; // 'hand' or 'mouse'
        this.cameraAvailable = false;
        this.mouseEvents = null;
        
        this.initializeToggleListeners();
    }

    initializeToggleListeners() {
        const handBtn = document.getElementById('handModeBtn');
        const mouseBtn = document.getElementById('mouseModeBtn');

        handBtn.addEventListener('click', () => this.switchToHandMode());
        mouseBtn.addEventListener('click', () => this.switchToMouseMode());
    }

    switchToHandMode() {
        if (!this.cameraAvailable) {
            this.showMessage('Camera không khả dụng. Vui lòng kiểm tra lại.', 'error');
            return;
        }

        this.mode = 'hand';
        this.disableMouseEvents();
        this.updateUI();
        this.hideHandCursor();
    }

    switchToMouseMode() {
        this.mode = 'mouse';
        this.enableMouseEvents();
        this.updateUI();
    }

    enableMouseEvents() {
        if (this.mouseEvents) return; // Already enabled

        this.mouseEvents = {
            mouseDown: this.handleMouseDown.bind(this),
            mouseMove: this.handleMouseMove.bind(this),
            mouseUp: this.handleMouseUp.bind(this)
        };

        document.addEventListener('mousedown', this.mouseEvents.mouseDown);
        document.addEventListener('mousemove', this.mouseEvents.mouseMove);
        document.addEventListener('mouseup', this.mouseEvents.mouseUp);
    }

    disableMouseEvents() {
        if (!this.mouseEvents) return;

        document.removeEventListener('mousedown', this.mouseEvents.mouseDown);
        document.removeEventListener('mousemove', this.mouseEvents.mouseMove);
        document.removeEventListener('mouseup', this.mouseEvents.mouseUp);
        
        this.mouseEvents = null;
    }

    handleMouseDown(event) {
        if (this.mode !== 'mouse') return;

        const segment = event.target.closest('.segment:not(.grabbed)');
        if (segment && !segment.classList.contains('hidden')) {
            this.gameState.grabbedSegment = {
                element: segment,
                segmentId: parseInt(segment.dataset.segmentId),
                originalParent: segment.parentElement
            };

            segment.classList.add('grabbed');
            segment.classList.remove('hovered');
            event.preventDefault();
        }
    }

    handleMouseMove(event) {
        if (this.mode !== 'mouse') return;

        // Update hover effects for mouse
        this.updateMouseHoverEffects(event.clientX, event.clientY);
    }

    handleMouseUp(event) {
        if (this.mode !== 'mouse' || !this.gameState.grabbedSegment) return;

        const grabbed = this.gameState.grabbedSegment;
        const dropZone = event.target.closest('.drop-zone');

        if (dropZone) {
            // Drop in zone
            const position = parseInt(dropZone.dataset.position) - 1;
            const dropContent = dropZone.querySelector('.drop-content');

            // Check if zone already has content
            if (this.gameState.dropZoneContents[position]) {
                const existingSegment = dropContent.querySelector('.segment');
                if (existingSegment) {
                    existingSegment.classList.remove('grabbed');
                    document.getElementById('segmentsArea').appendChild(existingSegment);
                    this.gameState.dropZoneContents[position] = null;
                }
            }

            // Place grabbed segment in zone
            dropContent.appendChild(grabbed.element);
            this.gameState.dropZoneContents[position] = this.getSegmentData(grabbed.segmentId);
        } else {
            // Drop back to original location
            grabbed.originalParent.appendChild(grabbed.element);
        }

        // Clean up
        grabbed.element.classList.remove('grabbed');
        this.gameState.grabbedSegment = null;
        this.gameState.updateUI();
    }

    updateMouseHoverEffects(mouseX, mouseY) {
        const hoverThreshold = 0; // Direct hover for mouse

        // Update segments hover
        const segments = document.querySelectorAll('.segment:not(.grabbed)');
        segments.forEach(segment => {
            if (segment.classList.contains('hidden')) return;
            
            const rect = segment.getBoundingClientRect();
            const isHovered = mouseX >= rect.left && mouseX <= rect.right && 
                             mouseY >= rect.top && mouseY <= rect.bottom;

            if (isHovered) {
                segment.classList.add('hovered');
            } else {
                segment.classList.remove('hovered');
            }
        });

        // Update drop zones hover
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            const rect = zone.getBoundingClientRect();
            const isHovered = mouseX >= rect.left && mouseX <= rect.right && 
                             mouseY >= rect.top && mouseY <= rect.bottom;

            if (isHovered) {
                zone.classList.add('highlight');
            } else {
                zone.classList.remove('highlight');
            }
        });
    }

    getSegmentData(segmentId) {
        return songData.segments.find(segment => segment.id === segmentId);
    }

    updateUI() {
        const handBtn = document.getElementById('handModeBtn');
        const mouseBtn = document.getElementById('mouseModeBtn');
        const modeIndicator = document.getElementById('currentMode');

        // Update button states
        handBtn.classList.toggle('active', this.mode === 'hand');
        mouseBtn.classList.toggle('active', this.mode === 'mouse');

        // Update mode indicator
        modeIndicator.textContent = this.mode === 'hand' ? '📱 Hand Tracking' : '🖱️ Mouse Control';
    }

    hideHandCursor() {
        const cursor = document.getElementById('handCursor');
        if (cursor) {
            cursor.style.display = 'none';
        }
    }

    showHandCursor() {
        const cursor = document.getElementById('handCursor');
        if (cursor) {
            cursor.style.display = 'block';
        }
    }

    showMessage(message, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setCameraAvailable(available) {
        this.cameraAvailable = available;
        if (!available && this.mode === 'hand') {
            this.switchToMouseMode();
            this.showMessage('Camera không khả dụng, chuyển sang Mouse mode', 'error');
        }
    }
}

// Game State Management
class GameState {
    constructor() {
        this.isHandDetected = false;
        this.isPinching = false;
        this.grabbedSegment = null;
        this.handPosition = { x: 0, y: 0 };
        this.gameStarted = false;
        this.shuffledSegments = [];
        this.dropZoneContents = [null, null, null]; // 3 drop zones
    }

    reset() {
        this.grabbedSegment = null;
        this.isPinching = false;
        this.dropZoneContents = [null, null, null];
        this.initializeGame();
    }

    initializeGame() {
        this.shuffledSegments = songData.getShuffledSegments();
        this.renderSegments();
        this.updateUI();
    }

    renderSegments() {
        const segmentsArea = document.getElementById('segmentsArea');
        segmentsArea.innerHTML = '';

        this.shuffledSegments.forEach(segment => {
            const segmentElement = document.createElement('div');
            segmentElement.className = 'segment';
            segmentElement.dataset.segmentId = segment.id;
            segmentElement.innerHTML = segment.text.replace(/\n/g, '<br>');
            segmentsArea.appendChild(segmentElement);
        });
    }

    updateUI() {
        // Update song title
        document.getElementById('songTitle').textContent = songData.title;
        
        // Update check button
        const checkBtn = document.getElementById('checkBtn');
        const allFilled = this.dropZoneContents.every(content => content !== null);
        checkBtn.disabled = !allFilled;
    }

    getUserOrder() {
        return this.dropZoneContents.map(content => content ? content.order : null);
    }
}

// Hand Tracking Management
class HandTracker {
    constructor(gameState) {
        this.gameState = gameState;
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.lastPinchState = false;
        
        this.initializeMediaPipe();
    }

    async initializeMediaPipe() {
        this.videoElement = document.querySelector('.input_video');
        this.canvasElement = document.querySelector('.output_canvas');
        this.canvasCtx = this.canvasElement.getContext('2d');

        // Initialize MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.onResults.bind(this));

        // Initialize camera
        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.hands.send({ image: this.videoElement });
            },
            width: 640,
            height: 480
        });

        this.camera.start();
    }

    onResults(results) {
        // Clear canvas
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            this.gameState.isHandDetected = true;
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw hand landmarks
            drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(this.canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });

            // Get hand position (using wrist as reference)
            const wrist = landmarks[0];
            this.gameState.handPosition = {
                x: wrist.x * this.canvasElement.width,
                y: wrist.y * this.canvasElement.height
            };

            // Detect pinch gesture
            const isPinching = this.detectPinchGesture(landmarks);
            
            // Handle pinch state changes
            if (isPinching && !this.lastPinchState) {
                // Just started pinching
                this.handlePinchStart();
            } else if (!isPinching && this.lastPinchState) {
                // Just stopped pinching
                this.handlePinchEnd();
            }

            this.gameState.isPinching = isPinching;
            this.lastPinchState = isPinching;

            // Update hover effects
            this.updateHoverEffects();

        } else {
            this.gameState.isHandDetected = false;
            this.gameState.isPinching = false;
        }

        // Update hand status display
        this.updateHandStatus();
        
        this.canvasCtx.restore();
    }

    detectPinchGesture(landmarks) {
        // Get thumb tip and index finger tip positions
        const thumbTip = landmarks[4];  // THUMB_TIP
        const indexTip = landmarks[8];  // INDEX_FINGER_TIP

        // Calculate distance between thumb and index finger
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) + 
            Math.pow(thumbTip.y - indexTip.y, 2)
        );

        // Pinch threshold (adjust as needed)
        const pinchThreshold = 0.05; // 5% of normalized coordinates
        return distance < pinchThreshold;
    }

    updateHandStatus() {
        const statusElement = document.getElementById('handStatus');
        const statusContainer = statusElement.parentElement;

        if (!this.gameState.isHandDetected) {
            statusElement.textContent = 'Đang tìm tay...';
            statusContainer.className = 'hand-status';
        } else if (this.gameState.isPinching) {
            statusElement.textContent = 'Đang cầm';
            statusContainer.className = 'hand-status pinching';
        } else {
            statusElement.textContent = 'Tay được phát hiện';
            statusContainer.className = 'hand-status detected';
        }
    }

    updateHoverEffects() {
        if (!this.gameState.isHandDetected) return;

        const handPos = this.gameState.handPosition;
        const hoverThreshold = 80; // pixels - increased for better interaction

        // Map hand position from mini camera to full screen
        const pageX = this.mapHandXToScreen(handPos.x / this.canvasElement.width);
        const pageY = this.mapHandYToScreen(handPos.y / this.canvasElement.height);

        // Add visual cursor to show hand position
        this.updateHandCursor(pageX, pageY);

        // Check segments for hover
        const segments = document.querySelectorAll('.segment:not(.grabbed)');
        segments.forEach(segment => {
            if (segment.classList.contains('hidden')) return;
            
            const rect = segment.getBoundingClientRect();
            const segmentCenterX = rect.left + rect.width / 2;
            const segmentCenterY = rect.top + rect.height / 2;

            const distance = Math.sqrt(
                Math.pow(pageX - segmentCenterX, 2) + 
                Math.pow(pageY - segmentCenterY, 2)
            );

            if (distance < hoverThreshold) {
                segment.classList.add('hovered');
            } else {
                segment.classList.remove('hovered');
            }
        });

        // Check drop zones for highlight
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            const rect = zone.getBoundingClientRect();
            const zoneCenterX = rect.left + rect.width / 2;
            const zoneCenterY = rect.top + rect.height / 2;

            const distance = Math.sqrt(
                Math.pow(pageX - zoneCenterX, 2) + 
                Math.pow(pageY - zoneCenterY, 2)
            );

            if (distance < hoverThreshold * 1.2) {
                zone.classList.add('highlight');
            } else {
                zone.classList.remove('highlight');
            }
        });
    }

    // Map hand X coordinate to full screen width
    mapHandXToScreen(normalizedX) {
        // Flip X for mirror effect (more natural)
        const flippedX = 1 - normalizedX;
        return flippedX * window.innerWidth;
    }

    // Map hand Y coordinate to full screen height  
    mapHandYToScreen(normalizedY) {
        return normalizedY * window.innerHeight;
    }

    // Create visual cursor to show hand position
    updateHandCursor(x, y) {
        let cursor = document.getElementById('handCursor');
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.id = 'handCursor';
            cursor.style.cssText = `
                position: fixed;
                width: 20px;
                height: 20px;
                border: 3px solid #4f46e5;
                border-radius: 50%;
                background: rgba(79, 70, 229, 0.3);
                pointer-events: none;
                z-index: 999;
                transition: all 0.1s ease;
                transform: translate(-50%, -50%);
            `;
            document.body.appendChild(cursor);
        }

        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
        
        // Change cursor style based on state
        if (this.gameState.isPinching) {
            cursor.style.borderColor = '#ef4444';
            cursor.style.background = 'rgba(239, 68, 68, 0.5)';
            cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
        } else {
            cursor.style.borderColor = '#4f46e5';
            cursor.style.background = 'rgba(79, 70, 229, 0.3)';
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    }

    handlePinchStart() {
        // Find hovered segment
        const hoveredSegment = document.querySelector('.segment.hovered:not(.hidden)');
        if (hoveredSegment) {
            this.gameState.grabbedSegment = {
                element: hoveredSegment,
                segmentId: parseInt(hoveredSegment.dataset.segmentId),
                originalParent: hoveredSegment.parentElement
            };

            hoveredSegment.classList.add('grabbed');
            hoveredSegment.classList.remove('hovered');
        }
    }

    handlePinchEnd() {
        if (!this.gameState.grabbedSegment) return;

        const grabbed = this.gameState.grabbedSegment;
        const highlightedZone = document.querySelector('.drop-zone.highlight');

        if (highlightedZone) {
            // Drop in zone
            const position = parseInt(highlightedZone.dataset.position) - 1; // 0-indexed
            const dropContent = highlightedZone.querySelector('.drop-content');

            // Check if zone already has content
            if (this.gameState.dropZoneContents[position]) {
                // Move existing content back to segments area
                const existingSegment = dropContent.querySelector('.segment');
                if (existingSegment) {
                    existingSegment.classList.remove('grabbed');
                    document.getElementById('segmentsArea').appendChild(existingSegment);
                    // Update game state
                    this.gameState.dropZoneContents[position] = null;
                }
            }

            // Place grabbed segment in zone
            dropContent.appendChild(grabbed.element);
            this.gameState.dropZoneContents[position] = this.getSegmentData(grabbed.segmentId);

        } else {
            // Drop back to original location
            grabbed.originalParent.appendChild(grabbed.element);
        }

        // Clean up
        grabbed.element.classList.remove('grabbed');
        this.gameState.grabbedSegment = null;

        // Update UI
        this.gameState.updateUI();
    }

    getSegmentData(segmentId) {
        return songData.segments.find(segment => segment.id === segmentId);
    }
}

// Audio Management
class AudioManager {
    constructor() {
        this.isPlaying = false;
    }

    async playUserSequence(userOrder, onComplete) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        
        // Filter out null values and get segment IDs
        const segmentIds = userOrder.filter(order => order !== null);
        
        audioConfig.playSequence(segmentIds, () => {
            this.isPlaying = false;
            if (onComplete) onComplete();
        });
    }
}

// Main Game Controller
class GameController {
    constructor() {
        this.gameState = new GameState();
        this.inputManager = new InputManager(this.gameState);
        this.audioManager = new AudioManager();
        
        this.initializeHandTracker();
        this.initializeEventListeners();
        this.gameState.initializeGame();
    }

    async initializeHandTracker() {
        try {
            this.handTracker = new HandTracker(this.gameState, this.inputManager);
            this.inputManager.setCameraAvailable(true);
            console.log('✅ Camera khởi tạo thành công');
        } catch (error) {
            console.warn('⚠️ Camera không khả dụng:', error);
            this.inputManager.setCameraAvailable(false);
            this.inputManager.switchToMouseMode();
        }
    }

    initializeEventListeners() {
        // Check button
        document.getElementById('checkBtn').addEventListener('click', () => {
            this.checkAndPlaySequence();
        });

        // Replay button
        document.getElementById('replayBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    async checkAndPlaySequence() {
        const userOrder = this.gameState.getUserOrder();
        
        // Disable check button during playback
        const checkBtn = document.getElementById('checkBtn');
        const replayBtn = document.getElementById('replayBtn');
        
        checkBtn.disabled = true;
        checkBtn.innerHTML = '🎵 Đang phát nhạc...';

        // Play sequence
        await this.audioManager.playUserSequence(userOrder, () => {
            // Check if correct
            const isCorrect = songData.checkOrder(userOrder);
            this.showResult(isCorrect);
            
            // Show replay button
            replayBtn.style.display = 'inline-block';
            checkBtn.style.display = 'none';
        });
    }

    showResult(isCorrect) {
        const resultsDiv = document.getElementById('results');
        const messageDiv = document.getElementById('resultMessage');
        
        resultsDiv.style.display = 'block';
        
        if (isCorrect) {
            messageDiv.textContent = '🎉 Chính xác! Bạn đã sắp xếp đúng thứ tự bài hát!';
            messageDiv.className = 'result-message correct';
        } else {
            messageDiv.textContent = '❌ Chưa đúng. Thử lại nhé!';
            messageDiv.className = 'result-message incorrect';
        }
    }

    resetGame() {
        // Reset UI
        document.getElementById('results').style.display = 'none';
        document.getElementById('checkBtn').style.display = 'inline-block';
        document.getElementById('checkBtn').innerHTML = '🎵 Kiểm tra & Phát nhạc';
        document.getElementById('replayBtn').style.display = 'none';
        
        // Clear drop zones
        const dropContents = document.querySelectorAll('.drop-content');
        dropContents.forEach(content => {
            const segment = content.querySelector('.segment');
            if (segment) {
                segment.classList.remove('grabbed', 'hovered');
                document.getElementById('segmentsArea').appendChild(segment);
            }
        });
        
        // Reset game state
        this.gameState.reset();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 Khởi tạo Game Puzzle Bài Xẩm...');
    
    // Check for required APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Trình duyệt không hỗ trợ camera. Vui lòng sử dụng trình duyệt hiện đại.');
        return;
    }
    
    if (!window.AudioContext && !window.webkitAudioContext) {
        alert('Trình duyệt không hỗ trợ Web Audio API.');
        return;
    }
    
    // Initialize game
    const gameController = new GameController();
    
    console.log('✅ Game đã sẵn sàng!');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    // Clean up resources if needed
    console.log('🔄 Đang dọn dẹp tài nguyên...');
});
