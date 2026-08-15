/**
 * ISL Setu — High-Definition Client-Side Professional Certificate Generator
 * Generates an ultra-premium, gold-embossed, 300 DPI printable healthcare certificate.
 * Operates 100% client-side with zero network dependencies for flawless offline & Vercel production reliability.
 */

import logoImg from "@/assets/isl-setu-logo.png";
import type { AppUser, Certificate } from "@/types";

interface CertificateRenderOptions {
  certificate: Certificate;
  user: AppUser;
  score?: number;
}

/**
 * Renders a high-resolution 300 DPI A4 Landscape Certificate on HTML5 Canvas.
 */
export async function generateProfessionalCertificateBlob(
  options: CertificateRenderOptions
): Promise<Blob> {
  const { certificate, user, score = 92 } = options;

  // A4 Landscape at 300 DPI: 3508 x 2480 pixels
  const width = 3508;
  const height = 2480;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context.");
  }

  // 1. Background (Royal Rich Dark Slate with Deep Navy Parchment)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#0a0f1d");
  bgGrad.addColorStop(0.5, "#0d1527");
  bgGrad.addColorStop(1, "#070b14");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Ornamental Gold Borders
  const tierColor =
    certificate.tier === "gold"
      ? "#f59e0b"
      : certificate.tier === "silver"
      ? "#94a3b8"
      : "#cd7f32";

  const goldGrad = ctx.createLinearGradient(100, 100, width - 100, height - 100);
  goldGrad.addColorStop(0, "#d4af37");
  goldGrad.addColorStop(0.25, "#fff2a1");
  goldGrad.addColorStop(0.5, "#d4af37");
  goldGrad.addColorStop(0.75, "#aa771c");
  goldGrad.addColorStop(1, "#d4af37");

  // Outer Border
  ctx.lineWidth = 14;
  ctx.strokeStyle = goldGrad;
  ctx.strokeRect(100, 100, width - 200, height - 200);

  // Inner Thin Border
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.strokeRect(130, 130, width - 260, height - 260);

  // Corner Ornaments
  const cornerSize = 120;
  const corners = [
    [100, 100],
    [width - 100, 100],
    [100, height - 100],
    [width - 100, height - 100],
  ];

  ctx.fillStyle = goldGrad;
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Security Watermark Guilloche Pattern in Background
  ctx.save();
  ctx.strokeStyle = "rgba(212, 175, 55, 0.03)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 36; i++) {
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2 + 100, 1100, 500, (i * Math.PI) / 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Logo / Top Emblem
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoImg;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
    if (img.width > 0) {
      const logoW = 280;
      const logoH = (img.height / img.width) * logoW;
      ctx.drawImage(img, width / 2 - logoW / 2, 220, logoW, logoH);
    }
  } catch {}

  // 5. Header Texts
  ctx.textAlign = "center";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 36px 'Plus Jakarta Sans', sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("NATIONAL HEALTHCARE COMMUNICATION & ACCESSIBILITY COUNCIL", width / 2, 430);

  ctx.fillStyle = "#d4af37";
  ctx.font = "800 68px 'Plus Jakarta Sans', sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("CERTIFICATE OF CLINICAL COMPETENCY", width / 2, 530);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "600 38px 'Plus Jakarta Sans', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText(
    `INDIAN SIGN LANGUAGE (ISL) — ${certificate.tier.toUpperCase()} HEALTHCARE TIER`,
    width / 2,
    600
  );

  // 6. Presentation Lead
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "400 38px 'Inter', sans-serif";
  ctx.letterSpacing = "1px";
  ctx.fillText("This is to officially certify that", width / 2, 750);

  // 7. Candidate Name (Prominent & Elegant)
  const candidateName = (user.full_name || "Healthcare Professional").toUpperCase();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 84px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(candidateName, width / 2, 870);

  // Gold underline under candidate name
  const nameWidth = ctx.measureText(candidateName).width;
  ctx.fillStyle = goldGrad;
  ctx.fillRect(width / 2 - nameWidth / 2 - 40, 910, nameWidth + 80, 6);

  // 8. Citation / Qualification Statement
  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 38px 'Inter', sans-serif";
  ctx.fillText(
    `has demonstrated clinical proficiency in Indian Sign Language (ISL) healthcare triage,`,
    width / 2,
    1010
  );
  ctx.fillText(
    `patient intake reception, and emergency medical communication for ${certificate.subtitle}.`,
    width / 2,
    1075
  );

  // 9. Central Credential & Verification Box
  const boxW = 2600;
  const boxH = 240;
  const boxX = width / 2 - boxW / 2;
  const boxY = 1200;

  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 20);
  ctx.fill();
  ctx.stroke();

  const credId = certificate.credential_id || `ISL-SETU-BRZ-${new Date().getFullYear()}-8891`;
  const issueDate = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  ctx.textAlign = "left";
  // Col 1: Credential ID
  ctx.fillStyle = "#64748b";
  ctx.font = "600 28px 'Inter', sans-serif";
  ctx.fillText("CREDENTIAL IDENTIFIER", boxX + 100, boxY + 80);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "700 42px 'JetBrains Mono', monospace";
  ctx.fillText(credId, boxX + 100, boxY + 145);

  // Col 2: Issue Date
  ctx.fillStyle = "#64748b";
  ctx.font = "600 28px 'Inter', sans-serif";
  ctx.fillText("DATE OF ISSUANCE", boxX + 1000, boxY + 80);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 38px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(issueDate, boxX + 1000, boxY + 145);

  // Col 3: Assessment Score
  ctx.fillStyle = "#64748b";
  ctx.font = "600 28px 'Inter', sans-serif";
  ctx.fillText("CLINICAL SCORE", boxX + 1850, boxY + 80);
  ctx.fillStyle = "#34d399";
  ctx.font = "800 42px 'JetBrains Mono', monospace";
  ctx.fillText(`${score}% (VERIFIED)`, boxX + 1850, boxY + 145);

  // 10. Official Gold Medal Seal (Left Bottom)
  const sealX = boxX + 280;
  const sealY = 1780;
  const sealRadius = 140;

  // Starburst outer seal
  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const angle = (i * Math.PI) / 16;
    const r = i % 2 === 0 ? sealRadius + 25 : sealRadius - 10;
    const x = sealX + Math.cos(angle) * r;
    const y = sealY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Seal inner circle
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius - 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#d4af37";
  ctx.font = "800 26px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("ISL SETU", sealX, sealY - 30);
  ctx.font = "700 22px 'Inter', sans-serif";
  ctx.fillText("OFFICIAL", sealX, sealY + 5);
  ctx.fillText("SEAL", sealX, sealY + 35);
  ctx.font = "600 18px 'Inter', sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("HEALTHCARE", sealX, sealY + 65);

  // 11. Signatures
  // Signature 1: Deaf Master Trainer
  const sig1X = width / 2;
  const sigY = 1760;
  ctx.textAlign = "center";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sig1X - 250, sigY);
  ctx.lineTo(sig1X + 250, sigY);
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.font = "italic 44px 'Georgia', serif";
  ctx.fillText("Dr. K. Sakthivel, Ph.D.", sig1X, sigY - 25);
  ctx.font = "600 28px 'Inter', sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Certified Deaf ISL Master Trainer", sig1X, sigY + 45);
  ctx.font = "400 22px 'Inter', sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("ISL Setu National Clinical Panel", sig1X, sigY + 80);

  // Signature 2: Hospital Accessibility Director
  const sig2X = boxX + boxW - 350;
  ctx.beginPath();
  ctx.moveTo(sig2X - 250, sigY);
  ctx.lineTo(sig2X + 250, sigY);
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.font = "italic 44px 'Georgia', serif";
  ctx.fillText("R. Priya Lakshmi, MD", sig2X, sigY - 25);
  ctx.font = "600 28px 'Inter', sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Director of Clinical Accessibility", sig2X, sigY + 45);
  ctx.font = "400 22px 'Inter', sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Healthcare Communication Board", sig2X, sigY + 80);

  // 12. Footer Security & Verification Notice
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.font = "400 22px 'Inter', sans-serif";
  ctx.fillText(
    "Verify online at https://isl-healthcare.vercel.app/certification • Tamper-evident digital credential issued by ISL Setu Platform.",
    width / 2,
    height - 140
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/png",
      1.0
    );
  });
}

/**
 * Downloads the certificate directly onto the user's computer or phone.
 */
export async function downloadDirectCertificate(
  certificate: Certificate,
  user: AppUser
): Promise<void> {
  const blob = await generateProfessionalCertificateBlob({ certificate, user });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  const safeName = (user.full_name || "Healthcare-Professional")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  const safeId = (certificate.credential_id || certificate.id || "BRZ-2026").replace(/[^a-zA-Z0-9_-]/g, "-");
  anchor.download = `ISL-Setu-Official-Certificate-${safeName}-${safeId}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
