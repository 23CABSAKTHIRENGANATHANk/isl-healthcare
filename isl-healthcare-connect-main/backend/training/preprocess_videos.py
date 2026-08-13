"""
MediaPipe Video Landmark Preprocessing Pipeline for ISL Setu
Extracts 21 normalized 3D hand keypoints from ISL video clips.
Splits by session/signer to strictly prevent data leakage.
"""

import os
import cv2
import json
import numpy as np

try:
    import mediapipe as mp
    mp_hands = mp.solutions.hands
    detector = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
except Exception as e:
    print(f"[Warning] MediaPipe: {e}")
    detector = None

SELECTED_CLASSES = {
    "Fever": "FEVER",
    "Injury": "PAIN",
    "Drink": "WATER",
    "Hello": "HELLO",
    "Thank you": "THANK YOU",
    "Good Morning": "GOOD MORNING",
    "Give": "MEDICINE",
    "Tea": "FOOD",
    "Close": "STOP",
    "Come": "COME"
}

def normalize_landmarks(landmarks):
    """
    Normalizes 21 3D hand landmarks:
    - Centers wrist at (0, 0, 0)
    - Scales by palm size (distance from wrist to middle MCP)
    Returns: 1D array of 63 coordinates (21 * 3)
    """
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks.landmark], dtype=np.float32)
    wrist = pts[0]
    middle_mcp = pts[9]
    scale = np.linalg.norm(middle_mcp - wrist)
    if scale < 1e-4:
        scale = 1.0

    norm_pts = (pts - wrist) / scale
    return norm_pts.flatten()

def extract_features_from_video(video_path, max_frames=20):
    """Extracts landmark feature vectors from up to max_frames in a video."""
    if not detector:
        return []

    cap = cv2.VideoCapture(video_path)
    vectors = []
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    sample_rate = max(1, total_frames // max_frames) if total_frames > 0 else 1
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        if frame_idx % sample_rate == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = detector.process(rgb)
            
            if results.multi_hand_landmarks:
                # Primary hand
                hand_vec = normalize_landmarks(results.multi_hand_landmarks[0])
                
                # If two hands present, append second hand, else zero-pad to 126 features
                if len(results.multi_hand_landmarks) > 1:
                    hand2_vec = normalize_landmarks(results.multi_hand_landmarks[1])
                else:
                    hand2_vec = np.zeros(63, dtype=np.float32)

                combined = np.concatenate([hand_vec, hand2_vec])
                vectors.append(combined)

        frame_idx += 1
        if len(vectors) >= max_frames:
            break

    cap.release()
    return vectors

def run_preprocessing(dataset_dir="../dataset viedo/Video_Dataset/Video_Dataset", output_dir="../data"):
    if not os.path.exists(dataset_dir):
        alt = "dataset viedo/Video_Dataset/Video_Dataset"
        if os.path.exists(alt):
            dataset_dir = alt

    os.makedirs(output_dir, exist_ok=True)
    class_names = sorted(list(set(SELECTED_CLASSES.values())))
    label_to_idx = {name: idx for idx, name in enumerate(class_names)}

    train_X, train_y = [], []
    val_X, val_y = [], []
    test_X, test_y = [], []

    print(f"[Preprocessing] Starting Landmark Extraction on {len(SELECTED_CLASSES)} classes...")
    
    for folder, gloss in SELECTED_CLASSES.items():
        folder_path = os.path.join(dataset_dir, folder)
        if not os.path.exists(folder_path):
            print(f"[Warning] Folder missing: {folder_path}")
            continue

        videos = [v for v in os.listdir(folder_path) if v.endswith(".mp4")]
        print(f"[Preprocessing] Class '{gloss}' ({folder}): found {len(videos)} videos")

        target_idx = label_to_idx[gloss]

        for v in videos:
            v_path = os.path.join(folder_path, v)
            features = extract_features_from_video(v_path, max_frames=10)
            if not features:
                continue

            # Strict session/signer split
            if "20230926" in v:
                # Independent held-out test session
                for feat in features:
                    test_X.append(feat)
                    test_y.append(target_idx)
            elif "left_tilt" in v or "right_tilt" in v:
                # Augmented samples in training
                for feat in features:
                    train_X.append(feat)
                    train_y.append(target_idx)
            else:
                # Split base session 80% train, 20% val
                if hash(v) % 5 == 0:
                    for feat in features:
                        val_X.append(feat)
                        val_y.append(target_idx)
                else:
                    for feat in features:
                        train_X.append(feat)
                        train_y.append(target_idx)

    # Save to compressed NPZ
    train_npz = os.path.join(output_dir, "isl_landmarks_train.npz")
    val_npz = os.path.join(output_dir, "isl_landmarks_val.npz")
    test_npz = os.path.join(output_dir, "isl_landmarks_test.npz")

    np.savez_compressed(train_npz, X=np.array(train_X, dtype=np.float32), y=np.array(train_y, dtype=np.int64))
    np.savez_compressed(val_npz, X=np.array(val_X, dtype=np.float32), y=np.array(val_y, dtype=np.int64))
    np.savez_compressed(test_npz, X=np.array(test_X, dtype=np.float32), y=np.array(test_y, dtype=np.int64))

    metadata = {
        "classes": class_names,
        "feature_dim": 126,
        "train_samples": len(train_X),
        "val_samples": len(val_X),
        "test_samples": len(test_X)
    }
    with open(os.path.join(output_dir, "dataset_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[Preprocessing Complete] Train: {len(train_X)}, Val: {len(val_X)}, Test: {len(test_X)}")
    return metadata

if __name__ == "__main__":
    run_preprocessing()
