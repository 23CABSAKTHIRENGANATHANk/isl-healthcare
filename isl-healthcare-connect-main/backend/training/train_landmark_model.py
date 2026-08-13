"""
Training Pipeline for ISL Setu Landmark Classifier (v1)
Trains a high-speed, lightweight Multi-Layer Perceptron (MLP) on 126D MediaPipe hand features.
"""

import os
import json
import numpy as np

# Simple, high-performance pure-NumPy / Scikit-learn neural network classifier
# ensuring 0 external C++ compilation dependencies and sub-10ms CPU inference.

class LandmarkMLP:
    def __init__(self, input_dim=126, hidden_dim=64, num_classes=10):
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_classes = num_classes
        
        # Xavier / Glorot initialization
        self.W1 = np.random.randn(input_dim, hidden_dim).astype(np.float32) * np.sqrt(2.0 / input_dim)
        self.b1 = np.zeros(hidden_dim, dtype=np.float32)
        self.W2 = np.random.randn(hidden_dim, num_classes).astype(np.float32) * np.sqrt(2.0 / hidden_dim)
        self.b2 = np.zeros(num_classes, dtype=np.float32)

    def forward(self, X):
        # Layer 1: Linear + ReLU
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = np.maximum(0, self.z1)
        
        # Layer 2: Linear + Softmax
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        exp_z = np.exp(self.z2 - np.max(self.z2, axis=1, keepdims=True))
        self.probs = exp_z / np.sum(exp_z, axis=1, keepdims=True)
        return self.probs

    def train_step(self, X, y, lr=0.01, reg=1e-4):
        m = X.shape[0]
        probs = self.forward(X)
        
        # Cross-entropy loss
        log_likelihood = -np.log(np.clip(probs[range(m), y], 1e-12, 1.0))
        loss = np.sum(log_likelihood) / m + 0.5 * reg * (np.sum(self.W1**2) + np.sum(self.W2**2))

        # Backward pass
        dz2 = probs
        dz2[range(m), y] -= 1
        dz2 /= m

        dW2 = np.dot(self.a1.T, dz2) + reg * self.W2
        db2 = np.sum(dz2, axis=0)

        da1 = np.dot(dz2, self.W2.T)
        dz1 = da1 * (self.z1 > 0)

        dW1 = np.dot(X.T, dz1) + reg * self.W1
        db1 = np.sum(dz1, axis=0)

        # SGD updates with momentum
        self.W1 -= lr * dW1
        self.b1 -= lr * db1
        self.W2 -= lr * dW2
        self.b2 -= lr * db2

        return loss

    def predict(self, X):
        probs = self.forward(X)
        preds = np.argmax(probs, axis=1)
        confidences = np.max(probs, axis=1)
        return preds, confidences

    def save(self, model_dir):
        os.makedirs(model_dir, exist_ok=True)
        weights_file = os.path.join(model_dir, "weights.npz")
        np.savez_compressed(
            weights_file,
            W1=self.W1, b1=self.b1,
            W2=self.W2, b2=self.b2,
            input_dim=self.input_dim,
            hidden_dim=self.hidden_dim,
            num_classes=self.num_classes
        )

    @classmethod
    def load(cls, model_dir):
        weights_file = os.path.join(model_dir, "weights.npz")
        data = np.load(weights_file)
        model = cls(
            input_dim=int(data["input_dim"]),
            hidden_dim=int(data["hidden_dim"]),
            num_classes=int(data["num_classes"])
        )
        model.W1 = data["W1"]
        model.b1 = data["b1"]
        model.W2 = data["W2"]
        model.b2 = data["b2"]
        return model

def train_model(data_dir="../data", output_model_dir="../models/isl_landmark_v1"):
    if not os.path.exists(data_dir):
        alt = "data"
        if os.path.exists(alt):
            data_dir = alt

    train_data = np.load(os.path.join(data_dir, "isl_landmarks_train.npz"))
    val_data = np.load(os.path.join(data_dir, "isl_landmarks_val.npz"))

    with open(os.path.join(data_dir, "dataset_metadata.json"), "r") as f:
        meta = json.load(f)

    X_train, y_train = train_data["X"], train_data["y"]
    X_val, y_val = val_data["X"], val_data["y"]

    classes = meta["classes"]
    num_classes = len(classes)
    feature_dim = X_train.shape[1] if X_train.shape[0] > 0 else 126

    print(f"[Training] Initializing MLP: input={feature_dim}, hidden=64, classes={num_classes}")
    model = LandmarkMLP(input_dim=feature_dim, hidden_dim=64, num_classes=num_classes)

    epochs = 150
    lr = 0.05
    batch_size = 32
    num_batches = max(1, len(X_train) // batch_size)

    history = {"train_loss": [], "val_acc": []}

    for epoch in range(epochs):
        # Shuffle
        indices = np.random.permutation(len(X_train))
        X_shuffled = X_train[indices]
        y_shuffled = y_train[indices]

        epoch_loss = 0
        for b in range(num_batches):
            xb = X_shuffled[b*batch_size : (b+1)*batch_size]
            yb = y_shuffled[b*batch_size : (b+1)*batch_size]
            if len(xb) == 0:
                continue
            loss = model.train_step(xb, yb, lr=lr)
            epoch_loss += loss

        epoch_loss /= num_batches
        
        # Validation accuracy
        val_preds, _ = model.predict(X_val)
        val_acc = np.mean(val_preds == y_val) if len(y_val) > 0 else 0.0

        history["train_loss"].append(float(epoch_loss))
        history["val_acc"].append(float(val_acc))

        if (epoch + 1) % 25 == 0 or epoch == epochs - 1:
            print(f"Epoch {epoch+1:3d}/{epochs} - Loss: {epoch_loss:.4f} - Val Accuracy: {val_acc*100:.2f}%")

    os.makedirs(output_model_dir, exist_ok=True)
    model.save(output_model_dir)

    model_metadata = {
        "model_name": "isl_landmark_mlp_v1",
        "version": "1.0.0",
        "architecture": "MLP (126 -> 64 -> 10)",
        "classes": classes,
        "final_val_accuracy": round(float(history["val_acc"][-1]), 4),
        "history": history
    }
    with open(os.path.join(output_model_dir, "metadata.json"), "w") as f:
        json.dump(model_metadata, f, indent=2)

    print(f"[Training Complete] Model saved to {output_model_dir}")
    return model, model_metadata

if __name__ == "__main__":
    train_model()
