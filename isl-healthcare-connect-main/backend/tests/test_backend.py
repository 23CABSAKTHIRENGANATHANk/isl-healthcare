"""
ISL Setu — Backend Python Tests
Tests for: certificate generator, sign recognizer constants, FastAPI endpoints.
Run: python -m pytest backend/tests/ -v
"""

import sys
import os

# Add backend root to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ─────────────────────────────────────────────────────────────
# Certificate Generator Tests
# ─────────────────────────────────────────────────────────────

class TestCertificateGenerator:
    """Tests for the stdlib-only PDF certificate generator."""

    def _make_pdf(self, **kw):
        from services.certificate_generator import generate_certificate_pdf
        defaults = dict(
            recipient_name="Dr. Test User",
            credential_id="ISL-BRONZE-TEST-1234",
            tier="bronze",
            role="nurse",
            score=85,
        )
        defaults.update(kw)
        return generate_certificate_pdf(**defaults)

    def test_returns_bytes(self):
        pdf = self._make_pdf()
        assert isinstance(pdf, bytes)

    def test_non_empty(self):
        pdf = self._make_pdf()
        assert len(pdf) > 500, "PDF must be at least 500 bytes"

    def test_valid_pdf_header(self):
        pdf = self._make_pdf()
        assert pdf.startswith(b"%PDF-1.4"), "Must start with PDF/1.4 magic"

    def test_has_eof_marker(self):
        pdf = self._make_pdf()
        assert b"%%EOF" in pdf

    def test_has_xref_table(self):
        pdf = self._make_pdf()
        assert b"xref" in pdf
        assert b"startxref" in pdf

    def test_credential_id_in_output(self):
        cred = "ISL-BRONZE-UNIQUEID-9876"
        pdf = self._make_pdf(credential_id=cred)
        assert cred.encode("latin-1") in pdf

    def test_all_tiers_produce_valid_pdf(self):
        from services.certificate_generator import generate_certificate_pdf
        for tier in ("bronze", "silver", "gold"):
            pdf = generate_certificate_pdf(
                recipient_name="Test User",
                credential_id=f"ISL-{tier.upper()}-T-0001",
                tier=tier,
                role="nurse",
                score=90,
            )
            assert pdf.startswith(b"%PDF-1.4"), f"Tier {tier} failed"

    def test_score_boundary_zero(self):
        pdf = self._make_pdf(score=0)
        assert pdf.startswith(b"%PDF-1.4")

    def test_score_boundary_hundred(self):
        pdf = self._make_pdf(score=100)
        assert pdf.startswith(b"%PDF-1.4")

    def test_long_name_does_not_crash(self):
        pdf = self._make_pdf(recipient_name="A" * 300)
        assert pdf.startswith(b"%PDF-1.4")

    def test_iso_date_parsing(self):
        pdf = self._make_pdf(issued_at="2026-08-14T00:00:00Z")
        assert pdf.startswith(b"%PDF-1.4")

    def test_invalid_date_falls_back_gracefully(self):
        pdf = self._make_pdf(issued_at="NOT-A-DATE")
        assert pdf.startswith(b"%PDF-1.4")

    def test_none_date_uses_today(self):
        pdf = self._make_pdf(issued_at=None)
        assert pdf.startswith(b"%PDF-1.4")


# ─────────────────────────────────────────────────────────────
# Sign Recognizer Constants Tests
# ─────────────────────────────────────────────────────────────

class TestSignRecognizerVocabulary:
    """Tests for HEALTHCARE_VOCABULARY and PHRASE_MAPPINGS."""

    def test_module_importable(self):
        try:
            from services.sign_recognizer import HEALTHCARE_VOCABULARY, PHRASE_MAPPINGS  # noqa
            assert True
        except ImportError as e:
            # Only MediaPipe/cv2 missing is acceptable
            if "mediapipe" in str(e).lower() or "cv2" in str(e).lower():
                import pytest; pytest.skip("MediaPipe not installed")
            raise

    def test_vocabulary_has_required_signs(self):
        try:
            from services.sign_recognizer import HEALTHCARE_VOCABULARY
        except ImportError as e:
            import pytest; pytest.skip(str(e))
        assert len(HEALTHCARE_VOCABULARY) >= 10

    def test_all_required_signs_present(self):
        try:
            from services.sign_recognizer import HEALTHCARE_VOCABULARY
        except ImportError as e:
            import pytest; pytest.skip(str(e))
        required = {"FEVER", "PAIN", "WATER", "HELLO", "THANK YOU",
                    "GOOD MORNING", "MEDICINE", "FOOD", "STOP", "COME"}
        assert required.issubset(set(HEALTHCARE_VOCABULARY))

    def test_every_sign_has_phrase(self):
        try:
            from services.sign_recognizer import HEALTHCARE_VOCABULARY, PHRASE_MAPPINGS
        except ImportError as e:
            import pytest; pytest.skip(str(e))
        for sign in HEALTHCARE_VOCABULARY:
            assert sign in PHRASE_MAPPINGS, f"Missing phrase for {sign}"
            assert len(PHRASE_MAPPINGS[sign]) > 5

    def test_phrases_end_with_punctuation(self):
        try:
            from services.sign_recognizer import PHRASE_MAPPINGS
        except ImportError as e:
            import pytest; pytest.skip(str(e))
        for sign, phrase in PHRASE_MAPPINGS.items():
            assert phrase[-1] in ".!?", f"No terminal punct for {sign}: {phrase!r}"


# ─────────────────────────────────────────────────────────────
# FastAPI App Smoke Tests
# ─────────────────────────────────────────────────────────────

class TestFastAPIAppImport:
    """Verifies FastAPI app can be imported and has expected endpoints."""

    def _import_app(self):
        try:
            import main as app_module
            return app_module
        except Exception as e:
            err = str(e).lower()
            if any(k in err for k in ["mediapipe", "cv2", "no module named"]):
                import pytest; pytest.skip(f"Dependency not installed: {e}")
            raise

    def test_app_imports(self):
        app = self._import_app()
        assert app is not None

    def test_fastapi_app_exists(self):
        app = self._import_app()
        assert hasattr(app, "app"), "FastAPI app object must exist"

    def test_pdf_endpoint_registered(self):
        app = self._import_app()
        assert hasattr(app, "download_certificate_pdf"), \
            "download_certificate_pdf endpoint must be defined"

    def test_predict_sign_endpoint_registered(self):
        app = self._import_app()
        assert hasattr(app, "predict_sign_endpoint") or hasattr(app, "predict_sign"), \
            "predict_sign endpoint must be defined in main.py"


# ─────────────────────────────────────────────────────────────
# Real-Time Gesture Kinematics & False Positive Rejection Tests
# ─────────────────────────────────────────────────────────────

class TestSignRecognizerKinematics:
    """Tests for landmark kinematics, gesture evaluation, and false-positive UNKNOWN rejection."""

    def _get_recognizer(self):
        from services.sign_recognizer import recognizer
        return recognizer

    def _make_dummy_landmarks(self, extended_indices=(8, 12)):
        """Creates 21 synthetic 3D landmarks with specified extended fingers."""
        landmarks = [[0.5, 0.8, 0.0] for _ in range(21)] # Wrist at base
        # MCP joints
        for i in [2, 5, 9, 13, 17]:
            landmarks[i] = [0.5 + (i - 9) * 0.03, 0.6, 0.0]
        # Extended fingertips (farther from wrist)
        for tip in [4, 8, 12, 16, 20]:
            if tip in extended_indices:
                landmarks[tip] = [0.5 + (tip - 12) * 0.03, 0.2, 0.0] # Far up
            else:
                landmarks[tip] = [0.5 + (tip - 12) * 0.02, 0.55, 0.0] # Curled near MCP
        return [{"x": pt[0], "y": pt[1], "z": pt[2]} for pt in landmarks]

    def test_empty_landmarks_returns_unknown(self):
        recognizer = self._get_recognizer()
        res = recognizer.predict_from_landmarks(landmarks=None, target_sign="DOCTOR")
        assert res["success"] is False
        assert res["sign"] == "UNKNOWN"

    def test_open_palm_does_not_match_doctor(self):
        """Open palm (5 extended fingers) must NOT match DOCTOR (requires 2 fingers)."""
        recognizer = self._get_recognizer()
        open_palm = self._make_dummy_landmarks(extended_indices=(4, 8, 12, 16, 20))
        res = recognizer.predict_from_landmarks(landmarks=[open_palm], target_sign="DOCTOR")
        assert res["success"] is False
        assert res["sign"] == "UNKNOWN"

    def test_two_fingers_matches_doctor(self):
        """2 extended fingers (index & middle) matches DOCTOR."""
        recognizer = self._get_recognizer()
        v_shape = self._make_dummy_landmarks(extended_indices=(8, 12))
        res = recognizer.predict_from_landmarks(landmarks=[v_shape], target_sign="DOCTOR")
        assert res["success"] is True
        assert res["sign"] == "DOCTOR"
        assert res["confidence"] >= 0.85

    def test_three_fingers_matches_water(self):
        """3 extended fingers (index, middle, ring) matches WATER."""
        recognizer = self._get_recognizer()
        w_shape = self._make_dummy_landmarks(extended_indices=(8, 12, 16))
        res = recognizer.predict_from_landmarks(landmarks=[w_shape], target_sign="WATER")
        assert res["success"] is True
        assert res["sign"] == "WATER"

    def test_closed_fist_does_not_match_hello(self):
        """Closed fist must NOT match HELLO (requires open palm)."""
        recognizer = self._get_recognizer()
        fist = self._make_dummy_landmarks(extended_indices=())
        res = recognizer.predict_from_landmarks(landmarks=[fist], target_sign="HELLO")
        assert res["success"] is False
        assert res["sign"] == "UNKNOWN"

    def test_open_palm_matches_help_and_hello(self):
        """Open palm matches HELP and HELLO."""
        recognizer = self._get_recognizer()
        open_palm = self._make_dummy_landmarks(extended_indices=(4, 8, 12, 16, 20))
        res_help = recognizer.predict_from_landmarks(landmarks=[open_palm], target_sign="HELP")
        res_hello = recognizer.predict_from_landmarks(landmarks=[open_palm], target_sign="HELLO")
        assert res_help["success"] is True
        assert res_hello["success"] is True

    def test_pointing_matches_injury(self):
        """Single index finger extended matches INJURY."""
        recognizer = self._get_recognizer()
        pointing = self._make_dummy_landmarks(extended_indices=(8,))
        res = recognizer.predict_from_landmarks(landmarks=[pointing], target_sign="INJURY")
        assert res["success"] is True
        assert res["sign"] == "INJURY"


# ─────────────────────────────────────────────────────────────
# Neural Text-to-Speech (TTS) Endpoint & Service Tests
# ─────────────────────────────────────────────────────────────

class TestTTSBackend:
    """Tests for the Neural Text-to-Speech service and /api/tts endpoint."""

    def test_tamil_clinical_dictionary_completeness(self):
        from services.tts_service import CLINICAL_TAMIL_DICTIONARY
        required = ["HELP", "DOCTOR", "NURSE", "PAIN", "FEVER", "MEDICINE", "WATER", "EMERGENCY"]
        for key in required:
            assert key in CLINICAL_TAMIL_DICTIONARY
            assert len(CLINICAL_TAMIL_DICTIONARY[key]) > 0
            # Ensure proper Tamil Unicode characters are present
            assert any(ord(c) >= 0x0B80 and ord(c) <= 0x0BFF for c in CLINICAL_TAMIL_DICTIONARY[key])

    def test_sanitize_tts_text_strips_emojis_and_html(self):
        from services.tts_service import sanitize_tts_text
        raw = "🚨 <b>மருத்துவரை</b> அழைக்கவும்! 😊   "
        clean = sanitize_tts_text(raw)
        assert clean == "மருத்துவரை அழைக்கவும்!"

    def test_tts_empty_text_raises_400(self):
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        res = client.post("/api/tts", json={"text": "", "language": "ta-IN"})
        assert res.status_code == 400

    def test_tts_unsupported_language_raises_400(self):
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        res = client.post("/api/tts", json={"text": "Hello", "language": "xx-YY"})
        assert res.status_code == 400

    def test_tts_excessive_length_raises_400(self):
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        res = client.post("/api/tts", json={"text": "அ" * 501, "language": "ta-IN"})
        assert res.status_code == 400

    def test_tts_endpoint_tamil_stream(self):
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        res = client.post("/api/tts", json={"text": "மருத்துவர்", "language": "ta-IN"})
        # Should return 200 with audio/mpeg or 503 if sandbox network blocks external TTS
        assert res.status_code in [200, 503]
        if res.status_code == 200:
            assert res.headers.get("content-type") == "audio/mpeg"
            assert len(res.content) > 100

