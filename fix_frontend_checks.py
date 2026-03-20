import os
import re

search_path = r"d:\copy-fyp-git\fyp-new-27-02-26\fyp\frontend\helmet_frontend\src"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the strict file_type check with a more flexible one that only checks for the existence of frames
    # Pattern: [object].file_type === 'video' && [object].extra_data?.violation_frames_paths
    # To: [object].extra_data?.violation_frames_paths
    new_content = re.sub(r"([a-zA-Z0-9_\.]+)\.file_type\s*===\s*'video'\s*&&\s*(\1\.extra_data\?\.violation_frames_paths)", r"\2", content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(search_path):
    for filename in files:
        if filename.endswith(".jsx") or filename.endswith(".js"):
            process_file(os.path.join(root, filename))
