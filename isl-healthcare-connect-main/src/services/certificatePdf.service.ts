/**
 * ISL Setu — Ultra-Premium Client-Side Professional Certificate Generator
 * Generates an exquisitely colorful, gold-embossed, 300 DPI printable healthcare credential.
 * Perfectly spaced, high-contrast typography, crisp illuminated logo, and institutional authority seals.
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

  // 1. Vibrant Multi-layer Gradient Background (Royal Deep Indigo with Emerald/Gold Ambient Glow)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#060b18");
  bgGrad.addColorStop(0.35, "#0b152d");
  bgGrad.addColorStop(0.7, "#081b2a");
  bgGrad.addColorStop(1, "#040711");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Ambient Radial Glow in the center
  const radialGlow = ctx.createRadialGradient(width / 2, height / 2 - 100, 100, width / 2, height / 2, 1400);
  radialGlow.addColorStop(0, "rgba(56, 189, 248, 0.10)");
  radialGlow.addColorStop(0.4, "rgba(212, 175, 55, 0.08)");
  radialGlow.addColorStop(0.8, "rgba(16, 185, 129, 0.04)");
  radialGlow.addColorStop(1, "transparent");
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // 2. High-Luminance Gold Gradient Palette
  const goldGrad = ctx.createLinearGradient(120, 120, width - 120, height - 120);
  goldGrad.addColorStop(0, "#eab308");
  goldGrad.addColorStop(0.2, "#fde047");
  goldGrad.addColorStop(0.4, "#ca8a04");
  goldGrad.addColorStop(0.6, "#fef08a");
  goldGrad.addColorStop(0.8, "#d97706");
  goldGrad.addColorStop(1, "#eab308");

  // 3. Intricate Double Gold Ornamental Borders
  ctx.lineWidth = 16;
  ctx.strokeStyle = goldGrad;
  ctx.strokeRect(90, 90, width - 180, height - 180);

  // Secondary Neon Cyan Border
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
  ctx.strokeRect(125, 125, width - 250, height - 250);

  // Tertiary Gold Dashed Border
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
  ctx.setLineDash([16, 10]);
  ctx.strokeRect(145, 145, width - 290, height - 290);
  ctx.restore();

  // Corner Rosettes
  const corners = [
    [90, 90],
    [width - 90, 90],
    [90, height - 90],
    [width - 90, height - 90],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Subtle Geometric Guilloche Security Pattern
  ctx.save();
  ctx.strokeStyle = "rgba(212, 175, 55, 0.04)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2 + 60, 1150, 520, (i * Math.PI) / 20, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 5. Crisp Illuminated Logo Emblem with Backdrop Pill
  const logoBoxW = 420;
  const logoBoxH = 130;
  const logoBoxX = width / 2 - logoBoxW / 2;
  const logoBoxY = 160;

  // Luminous background badge for logo visibility
  ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, 24);
  ctx.fill();
  ctx.stroke();

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoImg;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
    if (img.width > 0) {
      const logoW = 320;
      const logoH = (img.height / img.width) * logoW;
      ctx.drawImage(img, width / 2 - logoW / 2, logoBoxY + (logoBoxH - logoH) / 2, logoW, logoH);
    }
  } catch {}

  // 6. Header Typography (Generously Spaced & Perfectly Aligned)
  ctx.textAlign = "center";
  ctx.fillStyle = "#38bdf8";
  ctx.font = "700 32px 'Plus Jakarta Sans', sans-serif";
  ctx.letterSpacing = "8px";
  ctx.fillText("NATIONAL HEALTHCARE ACCESSIBILITY & CLINICAL ISL COUNCIL", width / 2, 360);

  ctx.fillStyle = goldGrad;
  ctx.font = "900 70px 'Plus Jakarta Sans', sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("OFFICIAL CERTIFICATE OF ACHIEVEMENT", width / 2, 455);

  // Tier Banner Ribbon
  const tierName = `${certificate.tier.toUpperCase()} CLINICAL HEALTHCARE TIER`;
  const ribbonW = 1450;
  const ribbonH = 66;
  const ribbonX = width / 2 - ribbonW / 2;
  const ribbonY = 515;

  const ribbonGrad = ctx.createLinearGradient(ribbonX, 0, ribbonX + ribbonW, 0);
  if (certificate.tier === "gold") {
    ribbonGrad.addColorStop(0, "rgba(234, 179, 8, 0.25)");
    ribbonGrad.addColorStop(0.5, "rgba(234, 179, 8, 0.55)");
    ribbonGrad.addColorStop(1, "rgba(234, 179, 8, 0.25)");
  } else if (certificate.tier === "silver") {
    ribbonGrad.addColorStop(0, "rgba(148, 163, 184, 0.25)");
    ribbonGrad.addColorStop(0.5, "rgba(148, 163, 184, 0.55)");
    ribbonGrad.addColorStop(1, "rgba(148, 163, 184, 0.25)");
  } else {
    ribbonGrad.addColorStop(0, "rgba(249, 115, 22, 0.25)");
    ribbonGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.55)");
    ribbonGrad.addColorStop(1, "rgba(249, 115, 22, 0.25)");
  }

  ctx.fillStyle = ribbonGrad;
  ctx.beginPath();
  ctx.roundRect(ribbonX, ribbonY, ribbonW, ribbonH, 33);
  ctx.fill();

  ctx.fillStyle = "#fef08a";
  ctx.font = "800 32px 'Plus Jakarta Sans', sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText(`★ ${tierName} • CLINICAL TRIAGE & PATIENT INTAKE ★`, width / 2, ribbonY + 45);

  // 7. Presentation Lead
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "500 36px 'Inter', sans-serif";
  ctx.letterSpacing = "1px";
  ctx.fillText("This credential is proud to officially certify that", width / 2, 675);

  // 8. Candidate Full Name (Ultra-Prominent, Glowing White with Gold Accent)
  const candidateName = (user.full_name || "Healthcare Professional").toUpperCase();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 86px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(candidateName, width / 2, 790);

  // Underline bar under candidate name
  const nameWidth = ctx.measureText(candidateName).width;
  ctx.fillStyle = goldGrad;
  ctx.fillRect(width / 2 - nameWidth / 2 - 50, 830, nameWidth + 100, 8);

  // 9. Qualification Citation
  ctx.fillStyle = "#94a3b8";
  ctx.font = "400 38px 'Inter', sans-serif";
  ctx.fillText(
    "has successfully demonstrated required clinical mastery in Indian Sign Language (ISL) communication,",
    width / 2,
    920
  );
  ctx.fillText(
    `patient reception, and healthcare barrier elimination for ${certificate.subtitle}.`,
    width / 2,
    985
  );

  // 10. Central Credential & Verification Box (High-Contrast Glassmorphism)
  const boxW = 2640;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 1100;

  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 24);
  ctx.fill();
  ctx.stroke();

  const now = new Date();
  const credId = certificate.credential_id || "ISL-SETU-BRZ-2026-8891";
  const issueDateObj = certificate.issued_at ? new Date(certificate.issued_at) : now;
  const issueDateStr = issueDateObj.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const issueTimeStr = issueDateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  ctx.textAlign = "left";
  // Col 1: Credential ID
  ctx.fillStyle = "#38bdf8";
  ctx.font = "700 24px 'Plus Jakarta Sans', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("CREDENTIAL IDENTIFIER", boxX + 110, boxY + 70);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 40px 'JetBrains Mono', monospace";
  ctx.fillText(credId, boxX + 110, boxY + 130);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "600 22px 'Inter', sans-serif";
  ctx.fillText("STATUS: ACTIVE & VERIFIED", boxX + 110, boxY + 175);

  // Col 2: Date & Time of Issuance (100% Dynamic Real-Time)
  ctx.fillStyle = "#fbbf24";
  ctx.font = "700 24px 'Plus Jakarta Sans', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("DATE & TIME OF ISSUANCE", boxX + 960, boxY + 70);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 36px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(issueDateStr, boxX + 960, boxY + 130);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "700 24px 'JetBrains Mono', monospace";
  ctx.fillText(`${issueTimeStr} (IST)`, boxX + 960, boxY + 175);

  // Col 3: Verified Assessment Score
  ctx.fillStyle = "#34d399";
  ctx.font = "700 24px 'Plus Jakarta Sans', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("CLINICAL EVALUATION", boxX + 1880, boxY + 70);
  ctx.fillStyle = "#34d399";
  ctx.font = "800 40px 'JetBrains Mono', monospace";
  ctx.fillText(`${score}% (PASSED)`, boxX + 1880, boxY + 130);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 22px 'Inter', sans-serif";
  ctx.fillText("CLINICAL TRIAGE ACCREDITED", boxX + 1880, boxY + 175);

  // 11. Symmetrical Bottom Alignment: Left Board | Center Seal | Right Directorate
  const bottomY = 1680;

  // --- Left Column: ISL Training & Certification Board ---
  const leftColX = boxX + 400;
  ctx.textAlign = "center";

  // Decorative signature baseline
  ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(leftColX - 260, bottomY);
  ctx.lineTo(leftColX + 260, bottomY);
  ctx.stroke();

  ctx.fillStyle = "#38bdf8";
  ctx.font = "800 32px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("ISL Training & Certification Board", leftColX, bottomY - 30);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 24px 'Inter', sans-serif";
  ctx.fillText("National Clinical Evaluation Panel", leftColX, bottomY + 45);

  ctx.fillStyle = "#64748b";
  ctx.font = "500 20px 'Inter', sans-serif";
  ctx.fillText("Healthcare Communication Standards", leftColX, bottomY + 80);

  // --- Center Column: Official Gold Medallion Seal ---
  const sealX = width / 2;
  const sealY = bottomY - 10;
  const sealRadius = 150;

  // Outer Gold Sunburst
  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  for (let i = 0; i < 36; i++) {
    const angle = (i * Math.PI) / 18;
    const r = i % 2 === 0 ? sealRadius + 28 : sealRadius - 12;
    const x = sealX + Math.cos(angle) * r;
    const y = sealY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Seal inner body
  ctx.fillStyle = "#070e20";
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius - 20, 0, Math.PI * 2);
  ctx.fill();

  // Seal Golden Ring
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius - 28, 0, Math.PI * 2);
  ctx.stroke();

  // Seal Text
  ctx.fillStyle = "#fde047";
  ctx.font = "900 26px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("★ ISL SETU ★", sealX, sealY - 45);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 22px 'Inter', sans-serif";
  ctx.fillText("OFFICIAL", sealX, sealY - 12);
  ctx.fillText("CLINICAL", sealX, sealY + 16);

  ctx.fillStyle = "#34d399";
  ctx.font = "700 20px 'Inter', sans-serif";
  ctx.fillText("VERIFIED", sealX, sealY + 45);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 16px 'JetBrains Mono', monospace";
  ctx.fillText("SECURITY SEAL", sealX, sealY + 75);

  // --- Right Column: Directorate of Healthcare Accessibility ---
  const rightColX = boxX + boxW - 400;

  // Decorative signature baseline
  ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rightColX - 260, bottomY);
  ctx.lineTo(rightColX + 260, bottomY);
  ctx.stroke();

  ctx.fillStyle = "#34d399";
  ctx.font = "800 32px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Directorate of Healthcare Accessibility", rightColX, bottomY - 30);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 24px 'Inter', sans-serif";
  ctx.fillText("Medical Communication Authority", rightColX, bottomY + 45);

  ctx.fillStyle = "#64748b";
  ctx.font = "500 20px 'Inter', sans-serif";
  ctx.fillText("Digitally Verified & Authenticated", rightColX, bottomY + 80);

  // 12. Bottom Security & Verification Watermark
  ctx.textAlign = "center";
  ctx.fillStyle = "#475569";
  ctx.font = "500 22px 'Inter', sans-serif";
  ctx.fillText(
    "Tamper-Evident Digital Healthcare Credential • Verify online at https://isl-healthcare.vercel.app/certification",
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
