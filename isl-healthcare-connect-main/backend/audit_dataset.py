"""
Comprehensive Dataset Audit Script for ISL Setu
Analyzes dataset viedo/ and sign dataset/
"""

import os
import cv2
import json

def audit_video_dataset(base_dir):
    print(f"Auditing Video Dataset at: {base_dir}")
    if not os.path.exists(base_dir):
        return {"error": f"Path {base_dir} does not exist"}

    classes = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
    classes.sort()

    report = {
        "total_classes": len(classes),
        "classes": {},
        "resolutions": set(),
        "fps_set": set(),
        "total_videos": 0,
        "corrupt_files": [],
        "signer_sessions": set()
    }

    for c in classes:
        c_dir = os.path.join(base_dir, c)
        files = [f for f in os.listdir(c_dir) if f.endswith((".mp4", ".avi", ".mov"))]
        report["total_videos"] += len(files)
        
        class_info = {
            "count": len(files),
            "sample_files": files[:3],
            "durations": [],
            "frames": []
        }

        # Sample first 2 videos to check properties
        for f in files[:2]:
            f_path = os.path.join(c_dir, f)
            # Check session from filename (e.g. WIN_20230901, WIN_20230926)
            parts = f.split("_")
            if len(parts) >= 2:
                report["signer_sessions"].add(parts[1])

            cap = cv2.VideoCapture(f_path)
            if not cap.isOpened():
                report["corrupt_files"].append(f_path)
                continue

            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            dur = n_frames / fps if fps > 0 else 0

            report["resolutions"].add(f"{w}x{h}")
            report["fps_set"].add(round(fps, 2))
            class_info["durations"].append(round(dur, 2))
            class_info["frames"].append(n_frames)
            cap.release()

        report["classes"][c] = class_info

    report["resolutions"] = list(report["resolutions"])
    report["fps_set"] = list(report["fps_set"])
    report["signer_sessions"] = list(report["signer_sessions"])
    return report

def audit_sign_mnist(base_dir):
    print(f"Auditing Sign MNIST Dataset at: {base_dir}")
    train_csv = os.path.join(base_dir, "sign_mnist_train.csv")
    test_csv = os.path.join(base_dir, "sign_mnist_test.csv")

    info = {
        "train_exists": os.path.exists(train_csv),
        "test_exists": os.path.exists(test_csv),
        "train_size_mb": round(os.path.getsize(train_csv) / (1024*1024), 2) if os.path.exists(train_csv) else 0,
        "test_size_mb": round(os.path.getsize(test_csv) / (1024*1024), 2) if os.path.exists(test_csv) else 0,
        "note": "Sign MNIST is American Sign Language (ASL) fingerspelling 24 classes (A-Y, excluding J/Z), 28x28 grayscale images."
    }
    return info

if __name__ == "__main__":
    video_base = os.path.abspath("../dataset viedo/Video_Dataset/Video_Dataset")
    if not os.path.exists(video_base):
        video_base = os.path.abspath("dataset viedo/Video_Dataset/Video_Dataset")

    video_report = audit_video_dataset(video_base)
    
    mnist_base = os.path.abspath("../sign dataset")
    if not os.path.exists(mnist_base):
        mnist_base = os.path.abspath("sign dataset")
    mnist_report = audit_sign_mnist(mnist_base)

    full_audit = {
        "video_dataset": video_report,
        "sign_mnist": mnist_report
    }

    with open("dataset_audit_raw.json", "w") as f:
        json.dump(full_audit, f, indent=2)

    print("Audit written to dataset_audit_raw.json")
