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

    def test_vocabulary_has_10_signs(self):
        try:
            from services.sign_recognizer import HEALTHCARE_VOCABULARY
        except ImportError as e:
            import pytest; pytest.skip(str(e))
        assert len(HEALTHCARE_VOCABULARY) == 10

    def test_all_required_signs_present(self):
        try:
            from services.sign_recognizer import HEALTHCARE_VOCABULARY
        except ImportError as e:
            import pytest; pytest.skip(str(e))
        required = {"FEVER", "PAIN", "WATER", "HELLO", "THANK YOU",
                    "GOOD MORNING", "MEDICINE", "FOOD", "STOP", "COME"}
        assert required == set(HEALTHCARE_VOCABULARY)

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
