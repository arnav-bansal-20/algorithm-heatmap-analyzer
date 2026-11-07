"""
Empirical Complexity Analysis Engine.
Fits measured benchmark data (time or operations) against all standard candidate complexity classes:
O(1), O(log n), O(n), O(n log n), O(n²), O(n³), O(2^n), O(n!).
Computes R² scores, residuals, MSE, fitted vs measured curves, and uncertainty indicators.
"""

import math
import numpy as np
from sklearn.linear_model import LinearRegression
from typing import Dict, Any, List, Tuple

class EmpiricalComplexityAnalyzer:
    CANDIDATE_CLASSES = [
        "O(1)",
        "O(log n)",
        "O(n)",
        "O(n log n)",
        "O(n²)",
        "O(n³)",
        "O(2^n)",
        "O(n!)"
    ]

    @staticmethod
    def _compute_feature(class_name: str, x_arr: np.ndarray) -> np.ndarray:
        """Transforms input sizes into the mathematical feature basis for class_name."""
        x = np.where(x_arr <= 0, 1.0, x_arr.astype(float))
        if class_name == "O(1)":
            return np.ones_like(x).reshape(-1, 1)
        elif class_name == "O(log n)":
            return np.log2(x).reshape(-1, 1)
        elif class_name == "O(n)":
            return x.reshape(-1, 1)
        elif class_name == "O(n log n)":
            return (x * np.log2(x)).reshape(-1, 1)
        elif class_name == "O(n²)":
            return (x ** 2).reshape(-1, 1)
        elif class_name == "O(n³)":
            return (x ** 3).reshape(-1, 1)
        elif class_name == "O(2^n)":
            # Cap exponent to avoid overflow in feature generation
            capped = np.minimum(x, 25.0)
            return (2.0 ** capped).reshape(-1, 1)
        elif class_name == "O(n!)":
            # Cap factorial input to avoid overflow
            capped = np.minimum(x, 12.0)
            factorials = np.array([float(math.factorial(int(v))) for v in capped])
            return factorials.reshape(-1, 1)
        return x.reshape(-1, 1)

    @classmethod
    def fit_complexity(
        cls,
        sizes: List[int],
        measurements: List[float],
        metric_name: str = "Execution Time (ms)"
    ) -> Dict[str, Any]:
        """
        Fits empirical measurements to all candidate complexity classes.
        Returns detailed R², residuals, fitted curves, and extrapolation models.
        """
        valid_pairs = [(s, m) for s, m in zip(sizes, measurements) if m is not None and s > 0]
        if len(valid_pairs) < 3:
            return {
                "predicted_class": "Insufficient Data",
                "confidence": 0.0,
                "fits": {},
                "residuals": {},
                "disclaimer": "At least 3 valid data points are required to compute empirical regression curves."
            }

        x_vals = np.array([p[0] for p in valid_pairs], dtype=float)
        y_vals = np.array([p[1] for p in valid_pairs], dtype=float)

        ss_tot = np.sum((y_vals - np.mean(y_vals)) ** 2)
        if ss_tot == 0:
            ss_tot = 1e-9

        fits = {}
        best_class = None
        best_r2 = -float('inf')
        best_model = None

        for c_name in cls.CANDIDATE_CLASSES:
            try:
                feat = cls._compute_feature(c_name, x_vals)
                if c_name == "O(1)":
                    # Simple mean predictor
                    pred = np.full_like(y_vals, np.mean(y_vals))
                    coef = 0.0
                    intercept = float(np.mean(y_vals))
                    resids = (y_vals - pred).tolist()
                    ss_res = np.sum((y_vals - pred) ** 2)
                    r2 = 1.0 - (ss_res / ss_tot)
                else:
                    reg = LinearRegression(fit_intercept=True)
                    reg.fit(feat, y_vals)
                    pred = reg.predict(feat)
                    coef = float(reg.coef_[0])
                    intercept = float(reg.intercept_)
                    resids = (y_vals - pred).tolist()
                    ss_res = np.sum((y_vals - pred) ** 2)
                    r2 = 1.0 - (ss_res / ss_tot)

                mse = float(np.mean((y_vals - pred) ** 2))
                
                # Penalize models that produce severe negative slope for growth models
                if c_name not in ["O(1)"] and coef < -1e-6:
                    r2 = max(0.0, r2 * 0.2)

                clamped_r2 = max(0.0, min(1.0, float(r2)))

                fits[c_name] = {
                    "r2": round(clamped_r2, 4),
                    "mse": round(mse, 4),
                    "coef": coef,
                    "intercept": intercept,
                    "residuals": [round(float(r), 4) for r in resids],
                    "fitted_points": [
                        {"size": int(x_vals[i]), "measured": round(float(y_vals[i]), 4), "fitted": round(float(pred[i]), 4)}
                        for i in range(len(x_vals))
                    ]
                }

                if clamped_r2 > best_r2:
                    best_r2 = clamped_r2
                    best_class = c_name
                    best_model = fits[c_name]
            except Exception:
                fits[c_name] = {
                    "r2": 0.0,
                    "mse": 999999.0,
                    "coef": 0.0,
                    "intercept": 0.0,
                    "residuals": [],
                    "fitted_points": []
                }

        # Extrapolations for large scale (100k, 1M)
        extrapolations = {}
        if best_class and best_model:
            for target_n in [10000, 100000, 1000000]:
                feat_large = cls._compute_feature(best_class, np.array([target_n]))
                pred_val = best_model["coef"] * feat_large[0][0] + best_model["intercept"]
                extrapolations[str(target_n)] = max(0.0, round(float(pred_val), 3))

        return {
            "predicted_class": best_class or "O(n)",
            "confidence": round(best_r2, 4),
            "r2_score": round(best_r2, 4),
            "metric_evaluated": metric_name,
            "fits": fits,
            "extrapolations": extrapolations,
            "disclaimer": "Empirical regression models fit practical benchmark measurements across the tested input range and do not mathematically prove asymptotic bounds."
        }

