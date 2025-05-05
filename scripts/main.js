/**
 * main.js - File chính khởi tạo và điều phối game Emotion Challenge
 */

// Đảm bảo tất cả DOM được tải trước khi chạy
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Emotion Game đang khởi tạo...');
    
    try {
        // Kiểm tra xem trình duyệt có hỗ trợ camera không
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError('Trình duyệt của bạn không hỗ trợ camera. Vui lòng sử dụng trình duyệt hiện đại như Chrome hoặc Firefox.');
            return;
        }
        
        // Kiểm tra xem TensorFlow.js và Face API có sẵn không
        if (!tf) {
            showError('Không thể tải TensorFlow.js. Vui lòng kiểm tra kết nối internet và thử lại.');
            return;
        }
        
        if (!faceapi) {
            showError('Không thể tải Face-API.js. Vui lòng kiểm tra kết nối internet và thử lại.');
            return;
        }
        
        // Thiết lập WebGL backend cho TensorFlow.js để tối ưu hiệu suất
        await tf.setBackend('webgl');
        console.log('TensorFlow.js sử dụng backend:', tf.getBackend());
        
        // Khởi tạo game
        const initialized = await Game.init();
        if (!initialized) {
            showError('Không thể khởi tạo game. Vui lòng tải lại trang và thử lại.');
            return;
        }
        
        console.log('Game đã sẵn sàng!');
        
        // Hiển thị màn hình chào mừng
        UI.showScreen('welcome');
        
    } catch (error) {
        console.error('Lỗi khởi tạo game:', error);
        showError('Đã xảy ra lỗi khi khởi tạo game. Vui lòng tải lại trang và thử lại.');
    }
});

// Hiển thị lỗi
function showError(message) {
    // Tạo phần tử hiển thị lỗi nếu chưa tồn tại
    let errorElement = document.getElementById('error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background-color: #f44336;
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 1000;
            font-weight: bold;
        `;
        document.body.prepend(errorElement);
    }
    
    errorElement.textContent = message;
}

// Thêm handler để xử lý lỗi không bắt được
window.addEventListener('error', (event) => {
    console.error('Lỗi không bắt được:', event.error);
    showError('Đã xảy ra lỗi không mong muốn. Vui lòng tải lại trang.');
});

// Thêm handler để xử lý promise rejection không bắt được
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejection không được xử lý:', event.reason);
    showError('Đã xảy ra lỗi không mong muốn. Vui lòng tải lại trang.');
});

// Hiện thông báo yêu cầu quyền truy cập camera
function requestCameraPermission() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            // Dừng stream ngay lập tức, chỉ cần kiểm tra quyền
            stream.getTracks().forEach(track => track.stop());
            console.log('Đã được cấp quyền truy cập camera');
        })
        .catch(error => {
            console.error('Không được cấp quyền truy cập camera:', error);
            showError('Vui lòng cấp quyền truy cập camera để sử dụng ứng dụng này.');
        });
}

// Thêm một số tùy chọn để xử lý memory leak
function cleanupResources() {
    // Dừng camera và nhận diện
    if (EmotionDetector && typeof EmotionDetector.stopCamera === 'function') {
        EmotionDetector.stopCamera();
    }
    
    // Giải phóng model TensorFlow.js (nếu cần)
    if (tf && tf.disposeVariables) {
        tf.disposeVariables();
    }
    
    console.log('Đã giải phóng tài nguyên');
}

// Xử lý khi người dùng rời trang
window.addEventListener('beforeunload', cleanupResources);

// Công cụ debug cho nhà phát triển
window.debugGame = {
    skipToLevel: (level) => {
        if (level > 0 && level <= Game.state.totalLevels) {
            Game.state.currentLevel = level;
            Game.startPreparation();
        } else {
            console.error('Level không hợp lệ. Vui lòng chọn level từ 1 đến', Game.state.totalLevels);
        }
    },
    completeCurrentLevel: () => {
        Game.completeLevel(95);
    },
    logGameState: () => {
        console.log('Game state:', JSON.parse(JSON.stringify(Game.state)));
    },
    testEmotionDetection: async () => {
        if (!EmotionDetector.isInitialized) {
            await EmotionDetector.init();
        }
        
        const video = document.getElementById('video') || document.getElementById('game-video');
        const canvas = document.getElementById('face-canvas') || document.getElementById('game-canvas');
        
        if (!video || !canvas) {
            console.error('Không tìm thấy video hoặc canvas');
            return;
        }
        
        await EmotionDetector.setupCamera(video);
        
        EmotionDetector.startDetection(video, canvas, 'happy', (result) => {
            console.log('Kết quả nhận diện:', result);
        });
        
        console.log('Đang chạy test nhận diện cảm xúc...');
    }
};

// Một số tùy chọn accessibility
function setupAccessibility() {
    // Thêm các thuộc tính ARIA
    document.querySelectorAll('.btn').forEach(button => {
        button.setAttribute('role', 'button');
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', button.textContent.trim());
        }
    });
    
    // Thêm khả năng điều hướng bằng bàn phím
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            if (document.activeElement.classList.contains('btn')) {
                document.activeElement.click();
                e.preventDefault();
            }
        }
    });
}

// Gọi thiết lập accessibility sau khi DOM được tải
document.addEventListener('DOMContentLoaded', setupAccessibility);
