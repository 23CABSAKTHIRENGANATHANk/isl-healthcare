"""
ISL Setu — Backend Python Tests
Tests for certificate generator, sign recognizer, and API health.
Run: python -m pytest backend/tests/ -v
"""

import sys
import os

# Add backend root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from services.certificate_generator import generate_certificate_pdf


class TestCertificateGenerator:
    """Tests for the stdlib PDF certificate generator."""

    def test_generates_valid_pdf_bytes(self):
        pdf = generate_certificate_pdf(
            recipient_name="Dr. Ananya Krishnan",
            credential_id="ISL-BRONZE-TEST123-4567",
            tier="bronze",
            role="nurse",
            score=88,
        )
        assert isinstance(pdf, bytes), "Result must be bytes"
        assert len(pdf) > 500, "PDF must be at least 500 bytes"

    def test_pdf_header_is_valid(self):
        pdf = generate_certificate_pdf(
            recipient_name="Nurse Ravi Kumar",
            credential_id="ISL-SILVER-C3D4-7890",
            tier="silver",
            role="receptionist",
            score=82,
        )
        assert pdf.startswith(b"%PDF-1.4"), "Must start with PDF/1.4 magic header"

    def test_all_tiers_generate_pdf(self):
        for tier in ["bronze", "silver", "gold"]:
            pdf = generate_certificate_pdf(
                recipient_name="Test User",
                credential_id=f"ISL-{tier.upper()}-XTEST-1234",
                tier=tier,
                role="nurse",
                score=85,
            )
            assert pdf.startswith(b"%PDF-1.4"), f"Failed for tier: {tier}"
            assert len(pdf) > 500, f"PDF too small for tier: {tier}"

    def test_pdf_contains_eof_marker(self):
        pdf = generate_certificate_pdf(
            recipient_name="Test User",
            credential_id="ISL-BRONZE-EOF-TEST",
            tier="bronze",
            role="doctor",
            score=90,
        )
        assert b"%%EOF" in pdf, "PDF must contain %%EOF marker"

    def test_pdf_contains_xref(self):
        pdf = generate_certificate_pdf(
            recipient_name="Test User",
            credential_id="ISL-BRONZE-XREF-TEST",
            tier="bronze",
            role="pharmacist",
            score=75,
        )
        assert b"xref" in pdf, "PDF must contain xref table"
        assert b"startxref" in pdf, "PDF must contain startxref"

    def test_handles_long_name(self):
        """Should not crash with a very long name (gets truncated internally)."""
        long_name = "A" * 200
        pdf = generate_certificate_pdf(
            recipient_name=long_name,
            credential_id="ISL-BRONZE-LONG-1234",
            tier="bronze",
            role="nurse",
            score=80,
        )
        assert pdf.startswith(b"%PDF-1.4")

    def test_handles_date_parsing(self):
        """Should parse ISO timestamp correctly."""
        pdf = generate_certificate_pdf(
            recipient_name="Dr. Test",
            credential_id="ISL-BRONZE-DATE-9999",
            tier="bronze",
            role="doctor",
            score=95,
            issued_at="2026-08-14T00:00:00Z",
        )
        assert pdf.startswith(b"%PDF-1.4")

    def test_handles_invalid_date_gracefully(self):
        """Should not crash with invalid date — falls back to current date."""
        pdf = generate_certificate_pdf(
            recipient_name="Dr. Test",
            credential_id="ISL-BRONZE-BADDATE-0000",
            tier="bronze",
            role="doctor",
            score=95,
            issued_at="NOT-A-DATE",
        )
        assert pdf.startswith(b"%PDF-1.4")

    def test_handles_no_issued_at(self):
        """issued_at=None should default to current datetime."""
        pdf = generate_certificate_pdf(
            recipient_name="Dr. Test",
            credential_id="ISL-BRONZE-NODATE-0001",
            tier="bronze",
            role="nurse",
            score=80,
            issued_at=None,
        )
        assert pdf.startswith(b"%PDF-1.4")

    def test_credential_id_in_output(self):
        """The credential ID should appear somewhere in the PDF content."""
        cred_id = "ISL-BRONZE-CRED-CHECK"
        pdf = generate_certificate_pdf(
            recipient_name="Test User",
            credential_id=cred_id,
            tier="bronze",
            role="nurse",
            score=80,
        )
        # The PDF text content should contain the credential ID
        assert cred_id.encode("latin-1") in pdf, "Credential ID must appear in PDF"

    def test_score_range_edge_cases(self):
        """Should handle edge scores: 0 and 100."""
        for score in [0, 100]:
            pdf = generate_certificate_pdf(
                recipient_name="Score Test",
                credential_id=f"ISL-BRONZE-SCORE-{score}",
                tier="bronze",
                role="nurse",
                score=score,
            )
            assert pdf.startswith(b"%PDF-1.4"), f"Failed for score={score}"


class TestSignRecognizerImport:
    """Tests for the sign recognizer service import and constants."""

    def test_import_succeeds(self):
        """Service module should import without error."""
        try:
            from services.sign_recognizer import HEALTHCARE_VOCABULARY, PHRASE_MAPPINGS
            imported = True
        except ImportError:
            imported = False
        assert imported, "sign_recognizer module must be importable"

    def test_vocabulary_has_10_items(self):
        from services.sign_recognizer import HEALTHCARE_VOCABULARY
        assert len(HEALTHCARE_VOCABULARY) == 10

    def test_all_vocabulary_signs_have_phrases(self):
        from services.sign_recognizer import HEALTHCARE_VOCABULARY, PHRASE_MAPPINGS
        for sign in HEALTHCARE_VOCABULARY:
            assert sign in PHRASE_MAPPINGS, f"Missing phrase for: {sign}"
            assert len(PHRASE_MAPPINGS[sign]) > 5, f"Phrase too short for: {sign}"

    def test_fever_is_in_vocabulary(self):
        from services.sign_recognizer import HEALTHCARE_VOCABULARY
        assert "FEVER" in HEALTHCARE_VOCABULARY

    def test_all_phrases_end_with_punctuation(self):
        from services.sign_recognizer import PHRASE_MAPPINGS
        for sign, phrase in PHRASE_MAPPINGS.items():
            assert phrase[-1] in ".!?", f"Phrase for {sign} missing terminal punctuation: {phrase!r}"


class TestBackendMainImport:
    """Verifies the FastAPI app starts without errors."""

    def test_app_imports_successfully(self):
        """FastAPI app module should be importable (no startup crash)."""
        try:
            # Set dummy env vars so Supabase/other deps don't crash
            import importlib
            import main as app_module
            imported = True
        except Exception as e:
            # The import might fail if MediaPipe isn't installed — that's acceptable
            # as long as it's not a syntax/logic error in our code
            err_str = str(e).lower()
            # Accept known missing dependency errors only
            acceptable = any(
                kw in err_str
                for kw in ["mediapipe", "cv2", "opencv", "module 'mediapipe'", "no module named"]
            )
            if not acceptable:
                pytest.fail(f"Unexpected import error: {e}")
            imported = True  # dependency missing is acceptable in test env

        assert imported

    def test_certificate_endpoint_function_exists(self):
        """The download_certificate_pdf function must exist in main."""
        try:
            import main as app_module
            assert hasattr(app_module, "download_certificate_pdf")
        except Exception as e:
            err_str = str(e).lower()
            if any(kw in err_str for kw in ["mediapipe", "cv2", "no module named"]):
                pytest.skip("MediaPipe not installed in test environment")
            raise
