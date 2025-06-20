# -*- coding: utf-8 -*-
import cv2
import mediapipe as mp
import numpy as np
import json
import os
import glob
from datetime import datetime
from pathlib import Path

class BatchPoseExtractor:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(static_image_mode=True)
        self.images_dir = "poses/images"
        self.processed_dir = "poses/processed"
        self.supported_formats = ['.jpg', '.jpeg', '.png', '.bmp']
        self.difficulties = ['easy', 'medium', 'hard']
        
        # Ensure directories exist
        os.makedirs(self.images_dir, exist_ok=True)
        os.makedirs(self.processed_dir, exist_ok=True)
        
        # Ensure difficulty directories exist
        for diff in self.difficulties:
            os.makedirs(os.path.join(self.images_dir, diff), exist_ok=True)
            os.makedirs(os.path.join(self.processed_dir, diff), exist_ok=True)
        
        print("🚀 Batch Pose Extractor đã sẵn sàng!")
        print("📁 Images folder: {}".format(self.images_dir))
        print("📁 Output folder: {}".format(self.processed_dir))
        print("🎯 Difficulty levels: {}".format(', '.join(self.difficulties)))

    def calculate_angle(self, a, b, c):
        """Tính góc giữa 3 điểm"""
        a, b, c = np.array(a), np.array(b), np.array(c)
        ba = a - b
        bc = c - b
        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
        angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
        return np.degrees(angle)

    def extract_pose_angles(self, landmarks):
        """Trích xuất 11 góc quan trọng từ landmarks"""
        def get_point(index):
            return (landmarks.landmark[index].x, landmarks.landmark[index].y)

        angles = [
            self.calculate_angle(get_point(11), get_point(13), get_point(15)),  # Gập tay trái
            self.calculate_angle(get_point(12), get_point(14), get_point(16)),  # Gập tay phải
            self.calculate_angle(get_point(15), get_point(13), get_point(11)),  # Nâng tay trái
            self.calculate_angle(get_point(16), get_point(14), get_point(12)),  # Nâng tay phải

            self.calculate_angle(get_point(23), get_point(25), get_point(27)),  # Gập gối trái
            self.calculate_angle(get_point(24), get_point(26), get_point(28)),  # Gập gối phải
            self.calculate_angle(get_point(25), get_point(23), get_point(11)),  # Thẳng chân trái
            self.calculate_angle(get_point(26), get_point(24), get_point(12)),  # Thẳng chân phải

            self.calculate_angle(get_point(11), get_point(0), get_point(12)),   # Góc đầu
            self.calculate_angle(get_point(11), get_point(23), get_point(25)),  # Lưng trái
            self.calculate_angle(get_point(12), get_point(24), get_point(26)),  # Lưng phải
        ]
        return angles

    def calculate_difficulty(self, angles):
        """Tự động xác định độ khó dựa trên variance của các góc"""
        mean_angle = np.mean(angles)
        variance = np.var(angles)
        
        # Phân loại dựa trên độ biến thiên
        if variance > 1000:
            return "Hard"
        elif variance > 500:
            return "Medium"
        else:
            return "Easy"

    def calculate_pose_quality(self, landmarks):
        """Tính chất lượng pose dựa trên visibility của key points"""
        key_points = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26]  # Key body points
        visible_count = sum(1 for idx in key_points if landmarks.landmark[idx].visibility > 0.5)
        return (visible_count / len(key_points)) * 100

    def get_next_pose_number(self):
        """Tìm số pose tiếp theo để tránh ghi đè"""
        existing_files = glob.glob(os.path.join(self.processed_dir, "pose_*.json"))
        if not existing_files:
            return 1
        
        numbers = []
        for file in existing_files:
            try:
                filename = os.path.basename(file)
                if filename.startswith("pose_") and filename.endswith(".json"):
                    num_str = filename[5:-5]  # Remove "pose_" and ".json"
                    numbers.append(int(num_str))
            except ValueError:
                continue
        
        return max(numbers) + 1 if numbers else 1

    def scan_images(self):
        """Quét tất cả ảnh trong thư mục images (legacy method)"""
        image_files = []
        
        for ext in self.supported_formats:
            pattern = os.path.join(self.images_dir, "*{}".format(ext))
            image_files.extend(glob.glob(pattern, recursive=False))
            
            # Also check uppercase extensions
            pattern = os.path.join(self.images_dir, "*{}".format(ext.upper()))
            image_files.extend(glob.glob(pattern, recursive=False))
        
        image_files = list(set(image_files))  # Remove duplicates
        image_files.sort()  # Sort for consistent processing order
        
        print("📸 Tìm thấy {} ảnh để xử lý:".format(len(image_files)))
        for img in image_files:
            print("   - {}".format(os.path.basename(img)))
        
        return image_files

    def scan_images_by_difficulty(self):
        """Quét ảnh theo từng mức độ khó"""
        image_sets = {}
        total_images = 0
        
        for difficulty in self.difficulties:
            diff_path = os.path.join(self.images_dir, difficulty)
            images = []
            
            if os.path.exists(diff_path):
                for ext in self.supported_formats:
                    pattern = os.path.join(diff_path, f"*{ext}")
                    images.extend(glob.glob(pattern))
                    
                    # Also check uppercase extensions
                    pattern = os.path.join(diff_path, f"*{ext.upper()}")
                    images.extend(glob.glob(pattern))
                
                images = list(set(images))  # Remove duplicates
                images.sort()
            
            image_sets[difficulty] = images
            total_images += len(images)
            
            print(f"📸 {difficulty.upper()}: {len(images)} ảnh")
            for img in images:
                print(f"   - {os.path.basename(img)}")
        
        print(f"\n📊 Tổng cộng: {total_images} ảnh")
        return image_sets

    def process_single_image(self, image_path):
        """Xử lý một ảnh duy nhất"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Không thể đọc ảnh: {image_path}")
            
            # Convert to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = self.pose.process(image_rgb)
            
            if results.pose_landmarks:
                # Extract angles
                angles = self.extract_pose_angles(results.pose_landmarks)
                
                # Calculate quality and difficulty
                quality = self.calculate_pose_quality(results.pose_landmarks)
                difficulty = self.calculate_difficulty(angles)
                
                return {
                    'success': True,
                    'angles': angles,
                    'quality': quality,
                    'difficulty': difficulty,
                    'landmarks': results.pose_landmarks
                }
            else:
                return {
                    'success': False,
                    'error': 'Không phát hiện được pose trong ảnh'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def load_existing_index(self):
        """Load index.json hiện có hoặc tạo mới với structure difficulty-based"""
        index_path = os.path.join(self.processed_dir, "index.json")
        
        if os.path.exists(index_path):
            try:
                with open(index_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Check if it's old format and convert
                    if "poses" in data and isinstance(data["poses"], list):
                        print("🔄 Converting old index format to new difficulty-based format...")
                        return self.convert_old_index_format(data)
                    
                    return data
            except Exception as e:
                print(f"⚠️ Lỗi đọc index.json: {e}")
                print("🔄 Tạo index mới...")
        
        return {
            "poses": {
                "easy": [],
                "medium": [],
                "hard": []
            },
            "total": {"easy": 0, "medium": 0, "hard": 0},
            "created": datetime.now().isoformat()
        }

    def convert_old_index_format(self, old_data):
        """Convert old index format to new difficulty-based format"""
        new_data = {
            "poses": {
                "easy": [],
                "medium": [],
                "hard": []
            },
            "total": {"easy": 0, "medium": 0, "hard": 0},
            "created": old_data.get("created", datetime.now().isoformat()),
            "converted_from_old_format": True
        }
        
        # Migrate old poses to new format
        for pose in old_data.get("poses", []):
            difficulty = pose.get("difficulty", "medium").lower()
            if difficulty in new_data["poses"]:
                new_data["poses"][difficulty].append(pose)
                new_data["total"][difficulty] += 1
        
        return new_data

    def update_index_json(self, new_poses_by_difficulty):
        """Cập nhật file index.json với poses mới theo difficulty"""
        index_data = self.load_existing_index()
        
        # Add new poses by difficulty
        for difficulty, poses in new_poses_by_difficulty.items():
            index_data["poses"][difficulty].extend(poses)
            index_data["total"][difficulty] = len(index_data["poses"][difficulty])
        
        index_data["last_updated"] = datetime.now().isoformat()
        
        # Save updated index
        index_path = os.path.join(self.processed_dir, "index.json")
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)
        
        total_poses = sum(index_data["total"].values())
        print(f"📊 Cập nhật index.json: {total_poses} poses tổng cộng")
        for diff, count in index_data["total"].items():
            print(f"   - {diff.upper()}: {count} poses")

    def update_index_json_legacy(self, new_poses):
        """Legacy method - for backward compatibility"""
        poses_by_difficulty = {"easy": [], "medium": [], "hard": []}
        
        for pose in new_poses:
            difficulty = pose.get("difficulty", "medium").lower()
            if difficulty in poses_by_difficulty:
                poses_by_difficulty[difficulty].append(pose)
        
        self.update_index_json(poses_by_difficulty)

    def backup_existing_data(self):
        """Backup dữ liệu hiện có"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = f"poses/backup_{timestamp}"
        
        if os.path.exists(self.processed_dir) and os.listdir(self.processed_dir):
            os.makedirs(backup_dir, exist_ok=True)
            
            for file in os.listdir(self.processed_dir):
                if file.endswith('.json'):
                    src = os.path.join(self.processed_dir, file)
                    dst = os.path.join(backup_dir, file)
                    with open(src, 'r') as f_src, open(dst, 'w') as f_dst:
                        f_dst.write(f_src.read())
            
            print(f"💾 Backup dữ liệu cũ vào: {backup_dir}")

    def process_all_images_by_difficulty(self, backup=True, min_quality=70):
        """Xử lý ảnh theo từng difficulty folder (NEW METHOD)"""
        print("=" * 50)
        print("🎯 BẮT ĐẦU BATCH PROCESSING BY DIFFICULTY")
        print("=" * 50)
        
        # Backup existing data
        if backup:
            self.backup_existing_data()
        
        # Scan for images by difficulty
        image_sets = self.scan_images_by_difficulty()
        
        total_images = sum(len(images) for images in image_sets.values())
        if total_images == 0:
            print("❌ Không tìm thấy ảnh nào trong các thư mục difficulty!")
            print("📁 Hãy copy ảnh vào poses/images/{easy,medium,hard}/")
            return
        
        # Process images by difficulty
        successful_poses_by_difficulty = {"easy": [], "medium": [], "hard": []}
        failed_images = []
        total_processed = 0
        
        for difficulty, image_files in image_sets.items():
            if not image_files:
                continue
                
            print(f"\n🔄 Xử lý {difficulty.upper()} poses...")
            print("-" * 30)
            
            for i, image_path in enumerate(image_files):
                image_name = os.path.basename(image_path)
                total_processed += 1
                print(f"📷 [{total_processed}/{total_images}] {difficulty.upper()}: {image_name}")
                
                result = self.process_single_image(image_path)
                
                if result['success']:
                    # Check quality threshold
                    if result['quality'] < min_quality:
                        print(f"   ⚠️ Chất lượng thấp ({result['quality']:.1f}%) - Bỏ qua")
                        failed_images.append({'file': image_name, 'reason': 'Low quality', 'difficulty': difficulty})
                        continue
                    
                    # Generate pose filename for specific difficulty
                    existing_count = len(successful_poses_by_difficulty[difficulty])
                    pose_filename = f"{difficulty}_pose_{existing_count + 1}.json"
                    pose_path = os.path.join(self.processed_dir, difficulty, pose_filename)
                    
                    # Save pose angles
                    with open(pose_path, 'w') as f:
                        json.dump(result['angles'], f)
                    
                    # Prepare index entry
                    pose_entry = {
                        "name": Path(image_name).stem.replace('_', ' ').title(),
                        "json": f"{difficulty}/{pose_filename}",
                        "image": f"{difficulty}/{image_name}",
                        "difficulty": difficulty.title()
                    }
                    
                    successful_poses_by_difficulty[difficulty].append(pose_entry)
                    
                    print(f"   ✅ Thành công → {pose_filename} (Q:{result['quality']:.1f}%)")
                    
                else:
                    print(f"   ❌ Thất bại: {result['error']}")
                    failed_images.append({'file': image_name, 'reason': result['error'], 'difficulty': difficulty})
        
        # Update index.json
        if any(successful_poses_by_difficulty.values()):
            self.update_index_json(successful_poses_by_difficulty)
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 KẾT QUẢ PROCESSING")
        print("=" * 50)
        
        total_successful = sum(len(poses) for poses in successful_poses_by_difficulty.values())
        print(f"✅ Thành công: {total_successful} poses")
        print(f"❌ Thất bại: {len(failed_images)} ảnh")
        
        for difficulty, poses in successful_poses_by_difficulty.items():
            if poses:
                print(f"\n🎯 {difficulty.upper()} poses ({len(poses)}):")
                for pose in poses:
                    print(f"   - {pose['name']}")
        
        if failed_images:
            print(f"\n⚠️ Ảnh xử lý thất bại:")
            for failed in failed_images:
                print(f"   - {failed['difficulty']}/{failed['file']}: {failed['reason']}")
        
        print(f"\n🎮 Game đã sẵn sàng với {total_successful} poses mới!")

    def process_all_images(self, backup=True, min_quality=70):
        """Xử lý tất cả ảnh trong thư mục (LEGACY METHOD)"""
        print("=" * 50)
        print("🎯 BẮT ĐẦU BATCH PROCESSING")
        print("=" * 50)
        
        # Backup existing data
        if backup:
            self.backup_existing_data()
        
        # Scan for images
        image_files = self.scan_images()
        
        if not image_files:
            print("❌ Không tìm thấy ảnh nào trong thư mục poses/images/")
            return
        
        # Process each image
        successful_poses = []
        failed_images = []
        start_pose_num = self.get_next_pose_number()
        
        print(f"\n🔄 Bắt đầu xử lý từ pose_{start_pose_num}.json...")
        print("-" * 50)
        
        for i, image_path in enumerate(image_files):
            image_name = os.path.basename(image_path)
            print(f"📷 [{i+1}/{len(image_files)}] Xử lý: {image_name}")
            
            result = self.process_single_image(image_path)
            
            if result['success']:
                # Check quality threshold
                if result['quality'] < min_quality:
                    print(f"   ⚠️ Chất lượng thấp ({result['quality']:.1f}%) - Bỏ qua")
                    failed_images.append({'file': image_name, 'reason': 'Low quality'})
                    continue
                
                # Generate pose data
                pose_num = start_pose_num + len(successful_poses)
                pose_filename = f"pose_{pose_num}.json"
                pose_path = os.path.join(self.processed_dir, pose_filename)
                
                # Save pose angles
                with open(pose_path, 'w') as f:
                    json.dump(result['angles'], f)
                
                # Prepare index entry
                pose_entry = {
                    "name": Path(image_name).stem.replace('_', ' ').title(),
                    "json": pose_filename,
                    "image": image_name,
                    "difficulty": result['difficulty']
                }
                
                successful_poses.append(pose_entry)
                
                print(f"   ✅ Thành công → {pose_filename} ({result['difficulty']}, Q:{result['quality']:.1f}%)")
                
            else:
                print(f"   ❌ Thất bại: {result['error']}")
                failed_images.append({'file': image_name, 'reason': result['error']})
        
        # Update index.json (using legacy method)
        if successful_poses:
            self.update_index_json_legacy(successful_poses)
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 KẾT QUẢ PROCESSING")
        print("=" * 50)
        print(f"✅ Thành công: {len(successful_poses)} poses")
        print(f"❌ Thất bại: {len(failed_images)} ảnh")
        
        if successful_poses:
            print(f"\n🎯 Poses mới được tạo:")
            for pose in successful_poses:
                print(f"   - {pose['name']} ({pose['difficulty']})")
        
        if failed_images:
            print(f"\n⚠️ Ảnh xử lý thất bại:")
            for failed in failed_images:
                print(f"   - {failed['file']}: {failed['reason']}")
        
        print(f"\n🎮 Game đã sẵn sàng với {len(successful_poses)} poses mới!")

def main():
    """Main function with difficulty-based processing support"""
    extractor = BatchPoseExtractor()
    
    print("🎯 Batch Pose Extractor for Web Game")
    print("📋 Hướng dẫn:")
    print("   1. Copy ảnh pose vào thư mục theo difficulty:")
    print("      - poses/images/easy/ (cho round 1,2)")
    print("      - poses/images/medium/ (cho round 3,4)")
    print("      - poses/images/hard/ (cho round 5)")
    print("   2. Chạy script này để tự động tạo JSON files")
    print("   3. Game sẽ tự động sử dụng poses theo difficulty!")
    print()
    
    # Check for difficulty-based images first
    image_sets = extractor.scan_images_by_difficulty()
    total_difficulty_images = sum(len(images) for images in image_sets.values())
    
    # Check for legacy images
    legacy_images = extractor.scan_images()
    
    if total_difficulty_images == 0 and len(legacy_images) == 0:
        print("❌ Không tìm thấy ảnh nào!")
        print("📁 Hãy copy ảnh pose vào thư mục trước khi chạy")
        return
    
    # Determine processing mode
    if total_difficulty_images > 0:
        print(f"\n🎯 Tìm thấy {total_difficulty_images} ảnh trong difficulty folders")
        response = input("🤔 Xử lý theo difficulty-based system? (y/n): ").strip().lower()
        if response in ['y', 'yes']:
            extractor.process_all_images_by_difficulty()
            return
    
    if len(legacy_images) > 0:
        print(f"\n📁 Tìm thấy {len(legacy_images)} ảnh trong poses/images/ (legacy mode)")
        response = input("🤔 Xử lý theo legacy mode? (y/n): ").strip().lower()
        if response in ['y', 'yes']:
            extractor.process_all_images()
            return
    
    print("🛑 Không có processing mode nào được chọn")

if __name__ == "__main__":
    main()
