/** A non-negative whole number as at least two digits: 3 becomes "03". */
export function twoDigits(n: number): string {
  return String(n).padStart(2, "0");
}
