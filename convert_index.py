# -*- coding: utf-8 -*-
import json
import os
from datetime import datetime

def convert_index():
    """Convert old index.json to new difficulty-based format"""
    index_path = "poses/processed/index.json"
    
    if not os.path.exists(index_path):
        print("Không tìm thấy index.json")
        return
    
    with open(index_path, 'r') as f:
        old_data = json.load(f)
    
    # Create new format
    new_data = {
        "poses": {
            "easy": [],
            "medium": [],
            "hard": []
        },
        "total": {"easy": 0, "medium": 0, "hard": 0},
        "created": old_data.get("created", datetime.now().isoformat()),
        "converted_from_old_format": True,
        "last_updated": datetime.now().isoformat()
    }
    
    # Convert old poses
    if isinstance(old_data.get("poses"), list):
        for pose in old_data["poses"]:
            difficulty = pose.get("difficulty", "medium").lower()
            if difficulty in new_data["poses"]:
                new_data["poses"][difficulty].append(pose)
                new_data["total"][difficulty] += 1
    
    # Save new format
    with open(index_path, 'w') as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
    
    print("✅ Converted index.json to new format")
    print("📊 Summary:")
    for diff, count in new_data["total"].items():
        print("   - {}: {} poses".format(diff.upper(), count))

if __name__ == "__main__":
    convert_index()
