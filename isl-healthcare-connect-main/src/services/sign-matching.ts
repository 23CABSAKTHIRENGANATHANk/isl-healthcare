export function normalizeSignLabel(value: string): string {
  return (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isTargetMatch(predicted: string, target: string, confidence = 1.0): boolean {
  const predictedNorm = normalizeSignLabel(predicted);
  const targetNorm = normalizeSignLabel(target);

  if (!predictedNorm || !targetNorm) return false;

  if (predictedNorm === targetNorm) return confidence >= 0.65;

  const candidateSet = new Set([
    predictedNorm,
    predictedNorm.replace(/\s+/g, ""),
    predictedNorm.replace(/\s+/g, " "),
  ]);

  return candidateSet.has(targetNorm) && confidence >= 0.65;
}
