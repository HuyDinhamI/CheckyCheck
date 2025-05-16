/**
 * Module giao tiếp với backend API
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// URL cơ bản API
const API_BASE_URL = 'http://localhost:5000';
// Các endpoint
export const API_ENDPOINTS = {
    GAME_MODES: `${API_BASE_URL}/game_modes`,
    START_GAME_ROUND: `${API_BASE_URL}/start_game_round`,
    PROCESS_FRAME: `${API_BASE_URL}/process_frame`,
    SUBMIT_SCORE: `${API_BASE_URL}/submit_score`,
    LEADERBOARD: `${API_BASE_URL}/leaderboard`
};
/**
 * Lấy danh sách các chế độ chơi
 */
export function getGameModes() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(API_ENDPOINTS.GAME_MODES);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    });
}
/**
 * Khởi tạo một vòng chơi mới
 * @param gameMode Chế độ chơi
 * @param currentRound Vòng chơi hiện tại
 */
export function startGameRound(gameMode, currentRound) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(API_ENDPOINTS.START_GAME_ROUND, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_mode: gameMode,
                current_round: currentRound
            })
        });
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    });
}
/**
 * Xử lý frame ảnh từ camera
 * @param imageData Base64 encoded image data
 * @param gameState Trạng thái game hiện tại
 */
export function processFrame(imageData_1, gameMode_1, targetEmotion_1) {
    return __awaiter(this, arguments, void 0, function* (imageData, gameMode, targetEmotion, threshold = 0.75, minIntensity = 0, maxIntensity = 1.0) {
        try {
            const response = yield fetch(API_ENDPOINTS.PROCESS_FRAME, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_data: imageData,
                    game_mode: gameMode,
                    target_emotion: targetEmotion,
                    threshold: threshold,
                    min_intensity: minIntensity,
                    max_intensity: maxIntensity
                })
            });
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        }
        catch (error) {
            console.error('Error processing frame:', error);
            return {
                detected_emotion: 'Error',
                confidence: 0,
                passed_round: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    });
}
/**
 * Gửi điểm số để lưu vào bảng xếp hạng
 * @param playerName Tên người chơi
 * @param score Điểm số
 * @param gameMode Chế độ chơi
 */
export function submitScore(playerName, score, gameMode) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(API_ENDPOINTS.SUBMIT_SCORE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_name: playerName,
                score: score,
                game_mode: gameMode
            })
        });
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    });
}
/**
 * Lấy bảng xếp hạng
 * @param gameMode Chế độ chơi (tùy chọn)
 * @param limit Số lượng kết quả tối đa
 */
export function getLeaderboard(gameMode_1) {
    return __awaiter(this, arguments, void 0, function* (gameMode, limit = 10) {
        let url = API_ENDPOINTS.LEADERBOARD + `?limit=${limit}`;
        if (gameMode) {
            url += `&game_mode=${encodeURIComponent(gameMode)}`;
        }
        const response = yield fetch(url);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
    });
}
//# sourceMappingURL=apiService.js.map