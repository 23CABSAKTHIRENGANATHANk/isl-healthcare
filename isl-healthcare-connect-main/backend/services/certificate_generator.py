"""
ISL Setu — PDF Certificate Generator
Produces an A4-style ISL Setu certificate as PDF bytes using only stdlib.
No external PDF library required (uses HTML→SVG ASCII approach).
"""

import io
import textwrap
from typing import Optional
from datetime import datetime


def _wrap(text: str, width: int) -> str:
    return "\n    ".join(textwrap.wrap(text, width))


def generate_certificate_pdf(
    recipient_name: str,
    credential_id: str,
    tier: str,
    role: str,
    score: int,
    issued_at: Optional[str] = None,
) -> bytes:
    """
    Generates a minimal valid PDF certificate without external libraries.
    Returns raw PDF bytes.
    """
    if issued_at:
        try:
            dt = datetime.fromisoformat(issued_at.replace("Z", "+00:00"))
            date_str = dt.strftime("%B %d, %Y")
        except Exception:
            date_str = datetime.utcnow().strftime("%B %d, %Y")
    else:
        date_str = datetime.utcnow().strftime("%B %d, %Y")

    tier_label = tier.capitalize()
    name_safe = recipient_name[:50]
    cred_safe = credential_id[:60]

    # Build a clean minimal PDF using direct PDF syntax
    # Fonts: Helvetica (standard PDF font, no embedding needed)
    contents_stream = f"""\
BT
/F1 28 Tf
1 0.84 0.2 rg
50 750 Td
(ISL SETU) Tj
0 0 0 rg
/F2 14 Tf
50 720 Td
(Indian Sign Language Healthcare Certification) Tj

/F2 10 Tf
0.5 0.5 0.5 rg
50 700 Td
(This is to certify that) Tj

/F1 22 Tf
0 0.3 0.6 rg
50 670 Td
({name_safe}) Tj

/F2 12 Tf
0 0 0 rg
50 645 Td
(has successfully completed the {tier_label} Level Healthcare ISL Proficiency Assessment) Tj
50 628 Td
(with a score of {score}% and demonstrated competency in Indian Sign Language) Tj
50 611 Td
(communication for healthcare settings.) Tj

/F2 10 Tf
0.4 0.4 0.4 rg
50 580 Td
(Role: {role.replace('_', ' ').title()}) Tj
50 563 Td
(Certification Level: {tier_label} Healthcare ISL) Tj
50 546 Td
(Credential ID: {cred_safe}) Tj
50 529 Td
(Issue Date: {date_str}) Tj

/F2 8 Tf
0.6 0.6 0.6 rg
50 490 Td
(ISL Setu is an AI-assisted learning platform. This certificate is for training purposes.) Tj
50 478 Td
(It does not constitute official government or clinical ISL accreditation.) Tj
ET

0.9 0.95 1 rg
48 460 754 4 re f

0 0.3 0.6 rg
48 740 6 6 re f
"""

    stream_bytes = contents_stream.encode("latin-1", errors="replace")
    stream_len = len(stream_bytes)

    # PDF object assembly
    objects: list[bytes] = []

    def add_obj(content: str) -> int:
        idx = len(objects) + 1
        objects.append(f"{idx} 0 obj\n{content}\nendobj\n".encode("latin-1"))
        return idx

    # Object 1: Catalog
    catalog_idx = add_obj("<< /Type /Catalog /Pages 2 0 R >>")

    # Object 2: Pages tree (placeholder — needs update after page obj)
    pages_placeholder = add_obj("<< /Type /Pages /Kids [4 0 R] /Count 1 >>")

    # Object 3: Font (Helvetica)
    font_idx = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    font_bold_idx = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

    # Object 5: Content stream
    stream_idx = add_obj(
        f"<< /Length {stream_len} >>\nstream\n" + contents_stream + "\nendstream"
    )

    # Object 6: Page (A4 = 595 x 842 pt)
    page_idx = add_obj(
        "<< /Type /Page\n"
        "/Parent 2 0 R\n"
        "/MediaBox [0 0 595 842]\n"
        f"/Contents {stream_idx} 0 R\n"
        "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>\n"
        ">>"
    )

    # Rebuild pages object with correct page ref
    objects[pages_placeholder - 1] = (
        f"2 0 obj\n<< /Type /Pages /Kids [{page_idx} 0 R] /Count 1 >>\nendobj\n"
    ).encode("latin-1")

    # Build xref table
    pdf_header = b"%PDF-1.4\n"
    body = b"".join(objects)
    offsets = []
    pos = len(pdf_header)
    for obj in objects:
        offsets.append(pos)
        pos += len(obj)

    xref_pos = len(pdf_header) + len(body)
    xref = [f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"]
    for off in offsets:
        xref.append(f"{off:010d} 00000 n \n")
    xref_str = "".join(xref)
    trailer = (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_pos}\n%%EOF\n"
    )

    return pdf_header + body + xref_str.encode("latin-1") + trailer.encode("latin-1")
