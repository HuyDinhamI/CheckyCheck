/**
 * Module giao tiếp với backend API
 */

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

// Interface/Type cho các API request/response
export interface GameMode {
    id: string;
    name: string;
    description: string;
}

export interface GameModeResponse {
    modes: GameMode[];
}

export interface GameRoundInfo {
    target_emotion?: string;
    emotion_sequence?: string[];
    current_emotion_index?: number;
    threshold: number;
    time_limit: number;
    round: number;
    min_intensity?: number;
    max_intensity?: number;
    sustain_time?: number;
    game_completed?: boolean;
}

export interface ProcessFrameResponse {
    detected_emotion: string;
    confidence: number;
    passed_round: boolean;
    in_intensity_range?: boolean;
    face_box?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    error?: string;
}

export interface SubmitScoreRequest {
    player_name: string;
    score: number;
    game_mode: string;
}

export interface LeaderboardEntry {
    player_name: string;
    score: number;
    game_mode: string;
    timestamp: number;
}

export interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
}

/**
 * Lấy danh sách các chế độ chơi
 */
export async function getGameModes(): Promise<GameModeResponse> {
    const response = await fetch(API_ENDPOINTS.GAME_MODES);
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Khởi tạo một vòng chơi mới
 * @param gameMode Chế độ chơi
 * @param currentRound Vòng chơi hiện tại
 */
export async function startGameRound(gameMode: string, currentRound: number): Promise<GameRoundInfo> {
    const response = await fetch(API_ENDPOINTS.START_GAME_ROUND, {
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
}

/**
 * Xử lý frame ảnh từ camera
 * @param imageData Base64 encoded image data
 * @param gameState Trạng thái game hiện tại
 */
export async function processFrame(
    imageData: string, 
    gameMode: string,
    targetEmotion?: string, 
    threshold: number = 0.75,
    minIntensity: number = 0,
    maxIntensity: number = 1.0
): Promise<ProcessFrameResponse> {
    try {
        const response = await fetch(API_ENDPOINTS.PROCESS_FRAME, {
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
    } catch (error) {
        console.error('Error processing frame:', error);
        return {
            detected_emotion: 'Error',
            confidence: 0,
            passed_round: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Gửi điểm số để lưu vào bảng xếp hạng
 * @param playerName Tên người chơi
 * @param score Điểm số
 * @param gameMode Chế độ chơi
 */
export async function submitScore(playerName: string, score: number, gameMode: string): Promise<{success: boolean}> {
    const response = await fetch(API_ENDPOINTS.SUBMIT_SCORE, {
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
}

/**
 * Lấy bảng xếp hạng
 * @param gameMode Chế độ chơi (tùy chọn)
 * @param limit Số lượng kết quả tối đa
 */
export async function getLeaderboard(gameMode?: string, limit: number = 10): Promise<LeaderboardResponse> {
    let url = API_ENDPOINTS.LEADERBOARD + `?limit=${limit}`;
    if (gameMode) {
        url += `&game_mode=${encodeURIComponent(gameMode)}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
}
