export function formatLitersValue(value: number) {
  return `${value.toLocaleString("nl-BE", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 3,
    maximumFractionDigits: 3,
  })} L`;
}

export function buildBatchCommitmentErrorMessage(orderedLiters: number, soldLiters: number, committedLiters: number) {
  const parts = [];

  if (orderedLiters > 0) {
    parts.push(`${formatLitersValue(orderedLiters)} besteld`);
  }

  if (soldLiters > 0) {
    parts.push(`${formatLitersValue(soldLiters)} verkocht`);
  }

  const detail = parts.length > 0 ? parts.join(" en ") : formatLitersValue(committedLiters);

  return `Deze batch heeft al ${detail}. Verlaag de output niet onder ${formatLitersValue(committedLiters)}.`;
}

export function canBookRequestedLiters(bookableLiters: number, requestedLiters: number) {
  return bookableLiters >= requestedLiters;
}
