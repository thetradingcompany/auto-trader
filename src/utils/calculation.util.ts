export function roundToNearestMultiple(numberToRoundOff: number, multipleOfNumber: number): number {
  return Math.round(numberToRoundOff / multipleOfNumber) * multipleOfNumber;
}
