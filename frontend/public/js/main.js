/**
 * File main.ts - Điểm vào của ứng dụng
 */
// Import các modules
import { uiManager } from './ui';
// Import API service để sử dụng các export types
import './apiService'; // no-op import
// Kiểm tra nếu trình duyệt hỗ trợ các API cần thiết
function checkBrowserSupport() {
    // Kiểm tra hỗ trợ camera API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Trình duyệt của bạn không hỗ trợ truy cập camera. Vui lòng sử dụng trình duyệt khác như Chrome hoặc Firefox.');
        return false;
    }
    // Kiểm tra hỗ trợ Canvas API
    if (!document.createElement('canvas').getContext) {
        alert('Trình duyệt của bạn không hỗ trợ Canvas API. Vui lòng sử dụng trình duyệt hiện đại hơn.');
        return false;
    }
    return true;
}
// Khởi tạo ứng dụng
function initApp() {
    // Kiểm tra hỗ trợ trình duyệt
    if (!checkBrowserSupport()) {
        return;
    }
    // Setup các event listeners cho UI
    uiManager.setupEventListeners();
    // Hiển thị màn hình chào mừng (đã được hiển thị tự động thông qua CSS active class)
    console.log('Ứng dụng đã khởi tạo thành công!');
}
// Đợi DOM load xong
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
//# sourceMappingURL=main.js.map