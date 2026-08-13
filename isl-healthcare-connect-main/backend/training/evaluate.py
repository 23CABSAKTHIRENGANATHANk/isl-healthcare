"""
Evaluation Script for ISL Setu Landmark Classifier (v1)
Runs test set inference, computes Precision, Recall, F1, and Confusion Matrix.
"""

import os
import json
import numpy as np
from train_landmark_model import LandmarkMLP

def evaluate_model(model_dir="../models/isl_landmark_v1", data_dir="../data"):
    if not os.path.exists(model_dir):
        alt_m = "models/isl_landmark_v1"
        if os.path.exists(alt_m):
            model_dir = alt_m

    if not os.path.exists(data_dir):
        alt_d = "data"
        if os.path.exists(alt_d):
            data_dir = alt_d

    model = LandmarkMLP.load(model_dir)
    test_data = np.load(os.path.join(data_dir, "isl_landmarks_test.npz"))
    
    with open(os.path.join(model_dir, "metadata.json"), "r") as f:
        meta = json.load(f)

    X_test, y_test = test_data["X"], test_data["y"]
    classes = meta["classes"]
    num_classes = len(classes)

    preds, confidences = model.predict(X_test)
    
    # Accuracy
    accuracy = float(np.mean(preds == y_test)) if len(y_test) > 0 else 0.0

    # Confusion matrix
    conf_matrix = np.zeros((num_classes, num_classes), dtype=int)
    for true_l, pred_l in zip(y_test, preds):
        conf_matrix[true_l, pred_l] += 1

    per_class_metrics = {}
    for i, c_name in enumerate(classes):
        tp = conf_matrix[i, i]
        fp = np.sum(conf_matrix[:, i]) - tp
        fn = np.sum(conf_matrix[i, :]) - tp

        precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

        per_class_metrics[c_name] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "support": int(np.sum(conf_matrix[i, :]))
        }

    macro_f1 = float(np.mean([m["f1_score"] for m in per_class_metrics.values()]))

    report = {
        "model_version": meta.get("version", "1.0.0"),
        "test_samples": len(X_test),
        "overall_accuracy": round(accuracy, 4),
        "macro_f1": round(macro_f1, 4),
        "per_class_metrics": per_class_metrics,
        "confusion_matrix": conf_matrix.tolist(),
        "classes": classes
    }

    report_path = os.path.join(model_dir, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print("=========================================================")
    print("           ISL SETU MODEL EVALUATION RESULTS             ")
    print("=========================================================")
    print(f"Overall Test Accuracy: {accuracy*100:.2f}%")
    print(f"Macro F1-Score:       {macro_f1*100:.2f}%")
    print("---------------------------------------------------------")
    for c_name, m in per_class_metrics.items():
        print(f"{c_name:<15} Precision: {m['precision']:.2f} | Recall: {m['recall']:.2f} | F1: {m['f1_score']:.2f}")
    print("=========================================================")

    return report

if __name__ == "__main__":
    evaluate_model()
