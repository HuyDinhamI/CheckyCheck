/**
 * emotionDetector.js - Module xử lý nhận diện khuôn mặt và cảm xúc
 * Có thể sử dụng model đã train hoặc face-api.js
 */

const EmotionDetector = {
    // Các thuộc tính
    isInitialized: false,
    model: null,
    faceDetector: null,
    currentStream: null,
    detectionInterval: null,
    emotions: ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'],
    emotionIcons: {
        'angry': '😠',
        'disgust': '🤢',
        'fear': '😨',
        'happy': '😊',
        'sad': '😢',
        'surprise': '😲',
        'neutral': '😐'
    },
    emotionLabels: {
        'angry': 'Giận Dữ',
        'disgust': 'Ghê Tởm',
        'fear': 'Sợ Hãi',
        'happy': 'Vui Vẻ',
        'sad': 'Buồn Bã',
        'surprise': 'Ngạc Nhiên',
        'neutral': 'Bình Thường'
    },
    
    // Khởi tạo detector
    async init() {
        try {
            // Tải model face-api.js và các model phụ
            await this.loadFaceApiModels();
            
            console.log('Face detection models loaded');
            
            // Nếu có custom model, tải custom model
            try {
                this.model = await this.loadCustomModel();
                console.log('Custom emotion model loaded');
            } catch (error) {
                console.warn('No custom model found or error loading it. Using face-api.js for emotions.');
            }
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing emotion detector:', error);
            return false;
        }
    },
    
    // Tải các models của face-api.js
    async loadFaceApiModels() {
        // Đường dẫn tới models của face-api (có thể thay đổi nếu cần)
        const modelUrl = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        // Tải các models cần thiết
        await faceapi.nets.tinyFaceDetector.load(modelUrl);
        await faceapi.nets.faceLandmark68Net.load(modelUrl);
        await faceapi.nets.faceExpressionNet.load(modelUrl);
        
        // Tạo face detector
        this.faceDetector = new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5
        });
    },
    
    // Tải custom model (nếu có)
    async loadCustomModel() {
        try {
            // Đường dẫn tới custom model
            const model = await tf.loadLayersModel('./models/emotion_model/model.json');
            return model;
        } catch (error) {
            console.warn('Error loading custom model:', error);
            throw error;
        }
    },
    
    // Khởi tạo camera
    async setupCamera(videoElement) {
        if (this.currentStream) {
            this.stopCamera();
        }
        
        try {
            // Yêu cầu quyền truy cập camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                }
            });
            
            videoElement.srcObject = stream;
            
            return new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    this.currentStream = stream;
                    resolve(true);
                };
            });
        } catch (error) {
            console.error('Error accessing camera:', error);
            return false;
        }
    },
    
    // Dừng camera
    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    },
    
    // Tiền xử lý ảnh từ video
    async preprocessImage(videoElement, canvas) {
        // Vẽ frame hiện tại từ video lên canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Phát hiện khuôn mặt sử dụng face-api.js
        const detection = await faceapi.detectSingleFace(videoElement, this.faceDetector)
            .withFaceLandmarks()
            .withFaceExpressions();
            
        if (!detection) {
            return { faceDetected: false };
        }
        
        // Lấy vùng khuôn mặt
        const box = detection.detection.box;
        
        // Trả về thông tin phát hiện
        return {
            faceDetected: true,
            detection: box,
            expressions: detection.expressions,
            landmarks: detection.landmarks
        };
    },
    
    // Dự đoán cảm xúc từ custom model (nếu có)
    async predictEmotionWithCustomModel(faceImage) {
        if (!this.model) return null;
        
        try {
            // Tiền xử lý ảnh cho model
            const processedImg = tf.browser.fromPixels(faceImage)
                .resizeBilinear([48, 48]) // Điều chỉnh kích thước phù hợp với model
                .mean(2) // Chuyển sang grayscale nếu model yêu cầu
                .expandDims(0)
                .expandDims(-1)
                .toFloat()
                .div(255.0); // Normalize
            
            // Dự đoán
            const prediction = await this.model.predict(processedImg);
            const result = Array.from(prediction.dataSync());
            
            // Giải phóng tensor
            tf.dispose([processedImg, prediction]);
            
            // Map kết quả với các cảm xúc
            return this.emotions.map((emotion, i) => ({
                emotion: emotion,
                probability: result[i]
            })).sort((a, b) => b.probability - a.probability);
        } catch (error) {
            console.error('Error predicting with custom model:', error);
            return null;
        }
    },
    
    // Bắt đầu nhận diện cảm xúc
    startDetection(videoElement, canvas, targetEmotion, callback) {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }
        
        this.detectionInterval = setInterval(async () => {
            try {
                // Tiền xử lý và phát hiện khuôn mặt
                const result = await this.preprocessImage(videoElement, canvas);
                
                if (!result.faceDetected) {
                    callback({
                        faceDetected: false,
                        message: 'Không phát hiện khuôn mặt'
                    });
                    return;
                }
                
                // Vẽ khung khuôn mặt
                UI.drawFaceBox(canvas, result.detection);
                
                let emotionResult;
                let matchPercentage = 0;
                
                // Sử dụng custom model nếu có, ngược lại sử dụng face-api.js
                if (this.model) {
                    // Crop khuôn mặt để đưa vào custom model
                    const faceCanvas = document.createElement('canvas');
                    faceCanvas.width = result.detection.width;
                    faceCanvas.height = result.detection.height;
                    
                    const faceCtx = faceCanvas.getContext('2d');
                    faceCtx.drawImage(
                        videoElement,
                        result.detection.x,
                        result.detection.y,
                        result.detection.width,
                        result.detection.height,
                        0, 0,
                        faceCanvas.width,
                        faceCanvas.height
                    );
                    
                    emotionResult = await this.predictEmotionWithCustomModel(faceCanvas);
                } else {
                    // Sử dụng kết quả từ face-api.js
                    emotionResult = Object.entries(result.expressions).map(([emotion, probability]) => ({
                        emotion: emotion.toLowerCase(),
                        probability
                    })).sort((a, b) => b.probability - a.probability);
                }
                
                if (emotionResult && emotionResult.length > 0) {
                    // Tìm cảm xúc mục tiêu
                    const targetEmotionResult = emotionResult.find(e => e.emotion === targetEmotion);
                    if (targetEmotionResult) {
                        matchPercentage = targetEmotionResult.probability * 100;
                    }
                    
                    // Hiển thị cảm xúc được phát hiện
                    const topEmotion = emotionResult[0];
                    const label = `${this.emotionLabels[topEmotion.emotion]} (${Math.round(topEmotion.probability * 100)}%)`;
                    UI.drawFaceBox(canvas, result.detection, label);
                    
                    callback({
                        faceDetected: true,
                        emotionResult: emotionResult,
                        targetMatching: matchPercentage,
                        topEmotion: topEmotion.emotion
                    });
                }
            } catch (error) {
                console.error('Error during detection:', error);
                callback({
                    faceDetected: false,
                    error: error.message
                });
            }
        }, 100); // Cập nhật 10 lần mỗi giây
    },
    
    // Dừng nhận diện
    stopDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    },
    
    // Lấy nhãn cảm xúc bằng tiếng Việt
    getEmotionLabel(emotion) {
        return this.emotionLabels[emotion] || emotion;
    },
    
    // Lấy biểu tượng cảm xúc
    getEmotionIcon(emotion) {
        return this.emotionIcons[emotion] || '😐';
    }
};
