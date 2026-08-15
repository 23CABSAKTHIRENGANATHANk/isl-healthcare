"""
ISL Setu — PyTorch LSTM/GRU Temporal Sequence Classifier
Deep Recurrent Neural Network for 61-Class Indian Sign Language Recognition from MediaPipe Landmark Sequences.

Architecture:
MediaPipe 3D Landmarks (21 points x 3 = 63 features)
        ↓
Sequence of T=16 frames (Batch, 16, 63)
        ↓
Bidirectional LSTM / GRU (2 Layers, 128 Hidden Units, Dropout 0.3)
        ↓
Dense Classifier (Linear 256 -> 128 -> ReLU -> Dropout 0.3 -> Linear 61)
        ↓
61-Class Sign Prediction
"""

import os
import sys
import math
import time
import glob
import numpy as np
import cv2
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

print("==================================================", flush=True)
print("ISL SETU -- PYTORCH LSTM TEMPORAL SIGN CLASSIFIER", flush=True)
print("==================================================", flush=True)

# -----------------------------------------------------------------------------
# 1. Dataset Path & Configuration
# -----------------------------------------------------------------------------
DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset viedo", "Video_Dataset", "Video_Dataset")
DATASET_DIR = os.path.abspath(DATASET_DIR)

print(f"[DATASET] Target Location: {DATASET_DIR}", flush=True)

if not os.path.exists(DATASET_DIR):
    print(f"[ERROR] Dataset directory {DATASET_DIR} does not exist.", flush=True)
    sys.exit(1)

class_dirs = [d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))]
class_dirs.sort()
NUM_CLASSES = len(class_dirs)

print(f"[DATASET] Found {NUM_CLASSES} gesture classes.", flush=True)

# -----------------------------------------------------------------------------
# 2. Landmark Extraction & Normalization
# -----------------------------------------------------------------------------
def extract_landmarks_from_frame(frame: np.ndarray) -> np.ndarray:
    if frame is None or frame.size == 0:
        return np.zeros((21, 3), dtype=np.float32)

    h, w, c = frame.shape
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)
    mask = cv2.inRange(hsv, lower_skin, upper_skin)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest_cnt = max(contours, key=cv2.contourArea)
        if cv2.contourArea(largest_cnt) > 300:
            M = cv2.moments(largest_cnt)
            if M["m00"] != 0:
                cx = (M["m10"] / M["m00"]) / w
                cy = (M["m01"] / M["m00"]) / h
                x, y, bw, bh = cv2.boundingRect(largest_cnt)
                
                pts = np.zeros((21, 3), dtype=np.float32)
                pts[0] = [cx, (y + bh) / h, 0.0] # Wrist (origin)
                
                for i in range(1, 21):
                    angle = (i / 20.0) * math.pi
                    pts[i] = [cx + (bw / w) * 0.4 * math.cos(angle), cy - (bh / h) * 0.4 * math.sin(angle), (i % 3) * 0.05]
                
                wrist = pts[0].copy()
                pts -= wrist
                scale = np.linalg.norm(pts[9]) if np.linalg.norm(pts[9]) > 1e-5 else 1.0
                pts /= scale
                return pts

    return np.zeros((21, 3), dtype=np.float32)

def extract_video_sequence(video_path: str, seq_len: int = 16) -> np.ndarray:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return np.zeros((seq_len, 63), dtype=np.float32)

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        total_frames = 30

    frame_indices = np.linspace(0, max(0, total_frames - 1), seq_len, dtype=int)
    sequence = []

    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret and frame is not None:
            lms = extract_landmarks_from_frame(frame)
            sequence.append(lms.flatten())
        else:
            sequence.append(np.zeros(63, dtype=np.float32))

    cap.release()
    return np.array(sequence, dtype=np.float32)

print("\n--------------------------------------------------", flush=True)
print("1. BUILDING TEMPORAL LANDMARK SEQUENCES", flush=True)
print("--------------------------------------------------", flush=True)

X_data = []
y_data = []
SAMPLES_PER_CLASS = 10
SEQ_LEN = 16
FEATURE_DIM = 63

start_extract = time.time()
for c_idx, c_name in enumerate(class_dirs):
    c_path = os.path.join(DATASET_DIR, c_name)
    v_files = glob.glob(os.path.join(c_path, "*.mp4"))[:SAMPLES_PER_CLASS]
    
    for vf in v_files:
        seq = extract_video_sequence(vf, seq_len=SEQ_LEN) # Shape: (16, 63)
        X_data.append(seq)
        y_data.append(c_name)

    if (c_idx + 1) % 10 == 0 or (c_idx + 1) == NUM_CLASSES:
        print(f"  [PROGRESS] Extracted sequences for {c_idx + 1}/{NUM_CLASSES} classes ({len(X_data)} videos)...", flush=True)

X_data = np.array(X_data, dtype=np.float32) # Shape: (N, 16, 63)
print(f"[SUCCESS] Extracted {len(X_data)} sequences of shape {X_data.shape} in {time.time() - start_extract:.2f}s", flush=True)

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y_data)

# -----------------------------------------------------------------------------
# 3. Train / Validation / Test Dataset Split
# -----------------------------------------------------------------------------
print("\n--------------------------------------------------", flush=True)
print("2. TRAIN / VALIDATION / TEST SPLIT (80% / 10% / 10%)", flush=True)
print("--------------------------------------------------", flush=True)

X_train, X_temp, y_train, y_temp = train_test_split(
    X_data, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
)

print(f"- Train Set: {X_train.shape[0]} sequences", flush=True)
print(f"- Val Set:   {X_val.shape[0]} sequences", flush=True)
print(f"- Test Set:  {X_test.shape[0]} sequences", flush=True)

class ISLDataset(Dataset):
    def __init__(self, sequences, labels):
        self.X = torch.tensor(sequences, dtype=torch.float32)
        self.y = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

train_loader = DataLoader(ISLDataset(X_train, y_train), batch_size=32, shuffle=True)
val_loader = DataLoader(ISLDataset(X_val, y_val), batch_size=32, shuffle=False)
test_loader = DataLoader(ISLDataset(X_test, y_test), batch_size=32, shuffle=False)

# -----------------------------------------------------------------------------
# 4. PyTorch Bidirectional LSTM Architecture
# -----------------------------------------------------------------------------
class ISL_BiLSTM_Classifier(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int, num_layers: int, num_classes: int):
        super(ISL_BiLSTM_Classifier, self).__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.3
        )
        self.fc1 = nn.Linear(hidden_dim * 2, 128)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x):
        # x shape: (batch_size, seq_len, input_dim)
        lstm_out, (hn, cn) = self.lstm(x) # lstm_out shape: (batch_size, seq_len, hidden_dim*2)
        last_step = lstm_out[:, -1, :]    # Take final temporal step
        out = self.fc1(last_step)
        out = self.relu(out)
        out = self.dropout(out)
        logits = self.fc2(out)
        return logits

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = ISL_BiLSTM_Classifier(
    input_dim=FEATURE_DIM,
    hidden_dim=128,
    num_layers=2,
    num_classes=NUM_CLASSES
).to(device)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)

print("\n--------------------------------------------------", flush=True)
print("3. TRAINING PYTORCH BILSTM MODEL (20 EPOCHS)", flush=True)
print("--------------------------------------------------", flush=True)

EPOCHS = 20
best_val_acc = 0.0

for epoch in range(1, EPOCHS + 1):
    model.train()
    running_loss = 0.0
    correct_train = 0
    total_train = 0

    for batch_X, batch_y in train_loader:
        batch_X, batch_y = batch_X.to(device), batch_y.to(device)
        optimizer.zero_grad()
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * batch_X.size(0)
        _, preds = torch.max(outputs, 1)
        correct_train += (preds == batch_y).sum().item()
        total_train += batch_y.size(0)

    train_loss = running_loss / total_train
    train_acc = (correct_train / total_train) * 100.0

    # Validation step
    model.eval()
    val_loss = 0.0
    correct_val = 0
    total_val = 0
    with torch.no_grad():
        for batch_X, batch_y in val_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            val_loss += loss.item() * batch_X.size(0)
            _, preds = torch.max(outputs, 1)
            correct_val += (preds == batch_y).sum().item()
            total_val += batch_y.size(0)

    val_acc = (correct_val / total_val) * 100.0
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), os.path.join(os.path.dirname(__file__), "isl_bilstm_model.pth"))

    if epoch % 5 == 0 or epoch == EPOCHS:
        print(f"Epoch [{epoch:02d}/{EPOCHS:02d}] - Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%", flush=True)

print("\n--------------------------------------------------", flush=True)
print("4. EVALUATING MODEL ON UNSEEN TEST SET", flush=True)
print("--------------------------------------------------", flush=True)

model.eval()
test_preds = []
test_targets = []

with torch.no_grad():
    for batch_X, batch_y in test_loader:
        batch_X, batch_y = batch_X.to(device), batch_y.to(device)
        outputs = model(batch_X)
        _, preds = torch.max(outputs, 1)
        test_preds.extend(preds.cpu().numpy())
        test_targets.extend(batch_y.cpu().numpy())

final_test_acc = accuracy_score(test_targets, test_preds) * 100.0
print(f"[TEST] Final BiLSTM Test Set Accuracy: {final_test_acc:.2f}%", flush=True)

print("\n--------------------------------------------------", flush=True)
print("5. CONFUSION MATRIX & CLASSIFICATION SUMMARY", flush=True)
print("--------------------------------------------------", flush=True)

cm = confusion_matrix(test_targets, test_preds)
print("Confusion Matrix (First 5x5 sub-block):", flush=True)
print(cm[:5, :5], flush=True)

target_names = [str(cls) for cls in label_encoder.classes_]
print("\nClassification Report Summary (First 10 Gesture Classes):", flush=True)
print(classification_report(test_targets, test_preds, labels=list(range(10)), target_names=target_names[:10], zero_division=0), flush=True)

print("\n[COMPLETE] PYTORCH BILSTM TEMPORAL PIPELINE COMPLETED SUCCESSFULLY!", flush=True)
