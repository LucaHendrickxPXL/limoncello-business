export function deriveBatchPrefix(name: string, sku: string | null) {
  const skuCandidate = sku
    ?.split("-")
    .find((part) => /^[a-z]{3,}$/i.test(part) && !/^fg$/i.test(part))
    ?.slice(0, 3)
    .toUpperCase();

  if (skuCandidate) {
    return skuCandidate;
  }

  const normalizedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lettersOnly = normalizedName.replace(/[^a-z]/gi, "");

  if (lettersOnly.length >= 3) {
    return lettersOnly.slice(0, 3).toUpperCase();
  }

  return "BAT";
}

export function formatSequenceNumber(prefix: string, sequenceKey: string, sequence: number, padLength: number) {
  return `${prefix}${sequenceKey}${String(sequence).padStart(padLength, "0")}`;
}

export function formatBatchNumber(prefix: string, yearPart: string, sequence: number) {
  return formatSequenceNumber(`${prefix}-`, `${yearPart}-`, sequence, 3);
}

export function formatOrderNumber(yearPart: string, sequence: number) {
  return formatSequenceNumber("ORD-", `${yearPart}-`, sequence, 4);
}
