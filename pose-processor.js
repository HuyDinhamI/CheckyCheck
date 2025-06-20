// ===== POSE PROCESSOR UTILITIES =====

class PoseProcessor {
    constructor() {
        this.mpPose = null;
        this.pose = null;
        this.isInitialized = false;
    }

    // Khởi tạo MediaPipe Pose
    async initialize() {
        try {
            this.mpPose = window.Pose;
            this.pose = new this.mpPose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.isInitialized = true;
            console.log('MediaPipe Pose initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing MediaPipe Pose:', error);
            return false;
        }
    }

    // Tính góc giữa 3 điểm
    calculateAngle(a, b, c) {
        // Convert to vectors
        const ba = [a[0] - b[0], a[1] - b[1]];
        const bc = [c[0] - b[0], c[1] - b[1]];
        
        // Calculate dot product and magnitudes
        const dotProduct = ba[0] * bc[0] + ba[1] * bc[1];
        const magnitudeBA = Math.sqrt(ba[0] * ba[0] + ba[1] * ba[1]);
        const magnitudeBC = Math.sqrt(bc[0] * bc[0] + bc[1] * bc[1]);
        
        // Calculate cosine angle (add small epsilon to avoid division by zero)
        const cosineAngle = dotProduct / (magnitudeBA * magnitudeBC + 1e-6);
        
        // Clamp cosine to valid range and calculate angle
        const clampedCosine = Math.max(-1, Math.min(1, cosineAngle));
        const angle = Math.acos(clampedCosine);
        
        // Convert to degrees
        return angle * (180 / Math.PI);
    }

    // Trích xuất 11 góc quan trọng từ landmarks
    extractPoseAngles(landmarks) {
        if (!landmarks || landmarks.length < 33) {
            return null;
        }

        const getPoint = (index) => [landmarks[index].x, landmarks[index].y];

        try {
            const angles = [
                // Tay
                this.calculateAngle(getPoint(11), getPoint(13), getPoint(15)), // Gập tay trái
                this.calculateAngle(getPoint(12), getPoint(14), getPoint(16)), // Gập tay phải
                this.calculateAngle(getPoint(15), getPoint(13), getPoint(11)), // Nâng tay trái
                this.calculateAngle(getPoint(16), getPoint(14), getPoint(12)), // Nâng tay phải

                // Chân
                this.calculateAngle(getPoint(23), getPoint(25), getPoint(27)), // Gập gối trái
                this.calculateAngle(getPoint(24), getPoint(26), getPoint(28)), // Gập gối phải
                this.calculateAngle(getPoint(25), getPoint(23), getPoint(11)), // Thẳng chân trái
                this.calculateAngle(getPoint(26), getPoint(24), getPoint(12)), // Thẳng chân phải

                // Thân & đầu
                this.calculateAngle(getPoint(11), getPoint(0), getPoint(12)),   // Góc đầu
                this.calculateAngle(getPoint(11), getPoint(23), getPoint(25)),  // Lưng trái
                this.calculateAngle(getPoint(12), getPoint(24), getPoint(26)),  // Lưng phải
            ];

            return angles;
        } catch (error) {
            console.error('Error extracting pose angles:', error);
            return null;
        }
    }

    // So sánh 2 pose (trả về độ lệch trung bình)
    comparePoseAngles(pose1, pose2) {
        if (!pose1 || !pose2 || pose1.length !== pose2.length) {
            return Infinity;
        }

        const differences = pose1.map((angle1, index) => {
            return Math.abs(angle1 - pose2[index]);
        });

        return differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    }

    // Xử lý ảnh và trích xuất pose
    async processImage(imageElement) {
        if (!this.isInitialized) {
            throw new Error('PoseProcessor not initialized');
        }

        return new Promise((resolve, reject) => {
            this.pose.onResults((results) => {
                if (results.poseLandmarks) {
                    const angles = this.extractPoseAngles(results.poseLandmarks);
                    resolve({
                        landmarks: results.poseLandmarks,
                        angles: angles
                    });
                } else {
                    resolve({
                        landmarks: null,
                        angles: null
                    });
                }
            });

            this.pose.send({ image: imageElement }).catch(reject);
        });
    }

    // Vẽ pose skeleton lên canvas
    drawPose(canvas, landmarks, connections = null) {
        if (!landmarks || !canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw connections (skeleton)
        if (connections && window.POSE_CONNECTIONS) {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();

            window.POSE_CONNECTIONS.forEach(connection => {
                const start = landmarks[connection[0]];
                const end = landmarks[connection[1]];
                
                if (start && end) {
                    ctx.moveTo(start.x * width, start.y * height);
                    ctx.lineTo(end.x * width, end.y * height);
                }
            });

            ctx.stroke();
        }

        // Draw landmarks (joints)
        landmarks.forEach((landmark, index) => {
            if (landmark.visibility > 0.5) {
                const x = landmark.x * width;
                const y = landmark.y * height;

                // Different colors for different body parts
                let color = '#ffffff';
                if (index <= 10) color = '#ff6b6b'; // Face
                else if (index <= 16) color = '#4ecdc4'; // Arms
                else if (index <= 22) color = '#45b7d1'; // Torso
                else color = '#96ceb4'; // Legs

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();

                // Add glow effect
                ctx.shadowColor = color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
    }

    // Tính chất lượng pose (độ tin cậy)
    calculatePoseQuality(landmarks) {
        if (!landmarks) return 0;

        const keyPoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26]; // Key body points
        const visiblePoints = keyPoints.filter(index => 
            landmarks[index] && landmarks[index].visibility > 0.5
        );

        return (visiblePoints.length / keyPoints.length) * 100;
    }

    // Load pose data từ JSON file
    async loadPoseData(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load pose data: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error loading pose data:', error);
            return null;
        }
    }

    // Load poses by difficulty (NEW METHOD)
    async loadAllPoseSamples() {
        const posePools = {
            easy: [],
            medium: [],
            hard: []
        };
        
        try {
            // Try to load a poses index file first
            const indexResponse = await fetch('poses/processed/index.json');
            if (indexResponse.ok) {
                const index = await indexResponse.json();
                
                // Check if it's new difficulty-based format
                if (index.poses && typeof index.poses === 'object' && !Array.isArray(index.poses)) {
                    // New format: poses organized by difficulty
                    for (const [difficulty, poseList] of Object.entries(index.poses)) {
                        if (posePools[difficulty]) {
                            for (const poseFile of poseList) {
                                const poseData = await this.loadPoseData(`poses/processed/${poseFile.json}`);
                                if (poseData) {
                                    posePools[difficulty].push({
                                        angles: poseData,
                                        image: `poses/images/${poseFile.image}`,
                                        name: poseFile.name || 'Unknown Pose',
                                        difficulty: poseFile.difficulty || difficulty
                                    });
                                }
                            }
                        }
                    }
                } else if (Array.isArray(index.poses)) {
                    // Old format: flat array, distribute by difficulty
                    for (const poseFile of index.poses) {
                        const poseData = await this.loadPoseData(`poses/processed/${poseFile.json}`);
                        if (poseData) {
                            const difficulty = (poseFile.difficulty || 'Medium').toLowerCase();
                            if (posePools[difficulty]) {
                                posePools[difficulty].push({
                                    angles: poseData,
                                    image: `poses/images/${poseFile.image}`,
                                    name: poseFile.name || 'Unknown Pose',
                                    difficulty: poseFile.difficulty || 'Medium'
                                });
                            }
                        }
                    }
                }
            } else {
                // Fallback: try to load common pose files
                console.warn('Index file not found, using fallback poses');
                const fallbackPoses = this.createSamplePoses();
                
                // Distribute fallback poses by difficulty
                fallbackPoses.forEach(pose => {
                    const difficulty = pose.difficulty.toLowerCase();
                    if (posePools[difficulty]) {
                        posePools[difficulty].push(pose);
                    }
                });
            }
        } catch (error) {
            console.warn('Could not load pose samples:', error);
            
            // Create sample poses for testing
            const fallbackPoses = this.createSamplePoses();
            fallbackPoses.forEach(pose => {
                const difficulty = pose.difficulty.toLowerCase();
                if (posePools[difficulty]) {
                    posePools[difficulty].push(pose);
                }
            });
        }

        console.log('Loaded pose pools:', {
            easy: posePools.easy.length,
            medium: posePools.medium.length,
            hard: posePools.hard.length
        });

        return posePools;
    }

    // Legacy method for backward compatibility
    async loadAllPoseSamplesLegacy() {
        const posePools = await this.loadAllPoseSamples();
        const allPoses = [];
        
        // Flatten all poses into single array
        Object.values(posePools).forEach(poses => {
            allPoses.push(...poses);
        });
        
        return allPoses;
    }

    // Tạo sample poses để test (khi chưa có data thực)
    createSamplePoses() {
        return [
            {
                angles: [90, 90, 180, 180, 170, 170, 160, 160, 90, 140, 140],
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFybXMgVXA8L3RleHQ+PC9zdmc+',
                name: 'Arms Up',
                difficulty: 'Easy'
            },
            {
                angles: [45, 45, 90, 90, 160, 160, 150, 150, 90, 130, 130],
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldhdmluZzwvdGV4dD48L3N2Zz4=',
                name: 'Waving',
                difficulty: 'Easy'
            },
            {
                angles: [90, 90, 135, 135, 90, 90, 120, 120, 90, 120, 120],
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPllvZ2EgUG9zZTwvdGV4dD48L3N2Zz4=',
                name: 'Yoga Pose',
                difficulty: 'Medium'
            },
            {
                angles: [120, 60, 150, 30, 90, 90, 100, 100, 90, 110, 110],
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRhbmNlPC90ZXh0Pjwvc3ZnPg==',
                name: 'Dance Move',
                difficulty: 'Hard'
            },
            {
                angles: [180, 180, 45, 45, 45, 45, 90, 90, 90, 160, 160],
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkx1bmdlPC90ZXh0Pjwvc3ZnPg==',
                name: 'Lunge Pose',
                difficulty: 'Hard'
            }
        ];
    }

    // Validate pose angles
    validatePoseAngles(angles) {
        if (!angles || !Array.isArray(angles) || angles.length !== 11) {
            return false;
        }

        return angles.every(angle => 
            typeof angle === 'number' && 
            !isNaN(angle) && 
            angle >= 0 && 
            angle <= 180
        );
    }

    // Get similarity percentage (0-100%)
    getSimilarityPercentage(angleDifference) {
        if (angleDifference <= 10) return 90 + (10 - angleDifference);
        if (angleDifference <= 20) return 70 + (20 - angleDifference) * 2;
        if (angleDifference <= 40) return 30 + (40 - angleDifference) * 2;
        return Math.max(0, 30 - angleDifference);
    }

    // Get similarity text description
    getSimilarityText(percentage) {
        if (percentage >= 90) return 'Hoàn hảo! 🎉';
        if (percentage >= 80) return 'Rất tốt! 👏';
        if (percentage >= 70) return 'Tốt! 👍';
        if (percentage >= 60) return 'Ổn đấy 😊';
        if (percentage >= 50) return 'Cố lên! 💪';
        return 'Thử lại nhé 🤔';
    }

    // Get points based on similarity
    getPoints(angleDifference) {
        if (angleDifference < 10) return 10;
        if (angleDifference < 20) return 7;
        return 3;
    }
}

// Export for use in other files
window.PoseProcessor = PoseProcessor;

// Pose connections for drawing skeleton
window.POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
    [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
    [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28],
    [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];
