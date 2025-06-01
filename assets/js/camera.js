// Camera handler class
class CameraHandler {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.isInitialized = false;
        this.frameInterval = null;
        this.onFrameCallback = null;
    }
    
    async init() {
        console.log('📹 Initializing camera...');
        
        try {
            // Get video and canvas elements
            this.video = document.getElementById('video');
            this.canvas = document.getElementById('canvas');
            this.context = this.canvas.getContext('2d');
            
            // Show loading
            this.showLoading(true);
            
            // Request camera permission
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            // Set video source
            this.video.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve();
                };
            });
            
            // Setup canvas size
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            this.isInitialized = true;
            this.showLoading(false);
            
            console.log('✅ Camera initialized successfully');
            
        } catch (error) {
            console.error('❌ Camera initialization failed:', error);
            this.showLoading(false);
            throw new Error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập và thử lại.');
        }
    }
    
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }
    
    startCapture(onFrameCallback) {
        if (!this.isInitialized) {
            console.error('Camera not initialized');
            return;
        }
        
        this.onFrameCallback = onFrameCallback;
        
        // Start capturing frames at 30 FPS
        this.frameInterval = setInterval(() => {
            this.captureFrame();
        }, 1000 / 30); // 30 FPS
        
        console.log('📸 Started frame capture');
    }
    
    stopCapture() {
        if (this.frameInterval) {
            clearInterval(this.frameInterval);
            this.frameInterval = null;
        }
        this.onFrameCallback = null;
        console.log('⏹️ Stopped frame capture');
    }
    
    captureFrame() {
        if (!this.isInitialized || !this.onFrameCallback) return;
        
        try {
            // Draw video frame to canvas
            this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Get image data as base64
            const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
            
            // Call the callback with image data
            this.onFrameCallback(imageData);
            
        } catch (error) {
            console.error('Error capturing frame:', error);
        }
    }
    
    getVideoElement() {
        return this.video;
    }
    
    getCanvasElement() {
        return this.canvas;
    }
    
    // Get current frame as base64
    getCurrentFrame() {
        if (!this.isInitialized) return null;
        
        try {
            this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            return this.canvas.toDataURL('image/jpeg', 0.8);
        } catch (error) {
            console.error('Error getting current frame:', error);
            return null;
        }
    }
    
    // Show face detection overlay
    showFaceOverlay(faces) {
        const overlay = document.getElementById('face-overlay');
        if (!overlay) return;
        
        if (faces && faces.length > 0) {
            const face = faces[0]; // Use first detected face
            const videoRect = this.video.getBoundingClientRect();
            
            // Calculate scale factors
            const scaleX = videoRect.width / this.video.videoWidth;
            const scaleY = videoRect.height / this.video.videoHeight;
            
            // Position overlay
            overlay.style.display = 'block';
            overlay.style.left = (face.x * scaleX) + 'px';
            overlay.style.top = (face.y * scaleY) + 'px';
            overlay.style.width = (face.w * scaleX) + 'px';
            overlay.style.height = (face.h * scaleY) + 'px';
        } else {
            overlay.style.display = 'none';
        }
    }
    
    destroy() {
        console.log('🔌 Destroying camera...');
        
        // Stop capture
        this.stopCapture();
        
        // Stop video stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }
        
        // Clear video
        if (this.video) {
            this.video.srcObject = null;
        }
        
        // Hide overlay
        const overlay = document.getElementById('face-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        this.isInitialized = false;
        console.log('✅ Camera destroyed');
    }
}

// Emotion prediction API client
class EmotionAPI {
    constructor() {
        this.baseURL = 'http://localhost:5000';
        this.isServerReady = false;
    }
    
    async checkServerHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            const data = await response.json();
            this.isServerReady = data.status === 'healthy' && data.model_loaded;
            return this.isServerReady;
        } catch (error) {
            console.error('Server health check failed:', error);
            this.isServerReady = false;
            return false;
        }
    }
    
    async predictEmotion(imageData) {
        if (!this.isServerReady) {
            throw new Error('Server not ready');
        }
        
        try {
            const response = await fetch(`${this.baseURL}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Prediction failed:', error);
            throw error;
        }
    }
}

// Face detection overlay helper
class FaceOverlayManager {
    constructor() {
        this.overlay = null;
        this.videoContainer = null;
    }
    
    init() {
        this.overlay = document.getElementById('face-overlay');
        this.videoContainer = document.querySelector('.video-container');
    }
    
    updateOverlay(faces, video) {
        if (!this.overlay || !faces || faces.length === 0) {
            this.hideOverlay();
            return;
        }
        
        const face = faces[0]; // Use first detected face
        const containerRect = this.videoContainer.getBoundingClientRect();
        const videoRect = video.getBoundingClientRect();
        
        // Calculate relative position within container
        const relativeLeft = videoRect.left - containerRect.left;
        const relativeTop = videoRect.top - containerRect.top;
        
        // Calculate scale factors
        const scaleX = videoRect.width / video.videoWidth;
        const scaleY = videoRect.height / video.videoHeight;
        
        // Position overlay
        this.overlay.style.display = 'block';
        this.overlay.style.left = (relativeLeft + face.x * scaleX) + 'px';
        this.overlay.style.top = (relativeTop + face.y * scaleY) + 'px';
        this.overlay.style.width = (face.w * scaleX) + 'px';
        this.overlay.style.height = (face.h * scaleY) + 'px';
    }
    
    hideOverlay() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
    
    setOverlayColor(color) {
        if (this.overlay) {
            this.overlay.style.borderColor = color;
            this.overlay.style.backgroundColor = color.replace(')', ', 0.1)').replace('rgb', 'rgba');
        }
    }
}
