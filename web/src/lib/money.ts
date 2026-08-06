/**
 * All monetary values in Nikela-OS are integer cents in ZAR. Floating point
 * rand values are never stored or passed between functions, because savings
 * splits and fee breakdowns must reconcile to the cent.
 */
export type Cents = number

/** Formats cents as a rand string, e.g. `R1 234.50`. */
export function formatCents(cents: Cents, options?: { showSign?: boolean }): string {
  const sign = cents < 0 ? '-' : options?.showSign && cents > 0 ? '+' : ''
  const absolute = Math.abs(cents)
  const rand = Math.floor(absolute / 100)
  const remainder = (absolute % 100).toString().padStart(2, '0')
  const groupedRand = rand.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${sign}R${groupedRand}.${remainder}`
}

/** Formats cents as whole rand, e.g. `R1 235`, for dense summary tiles. */
export function formatRand(cents: Cents): string {
  const sign = cents < 0 ? '-' : ''
  const rand = Math.round(Math.abs(cents) / 100)
  return `${sign}R${rand.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
}

/** Renders a ratio as a rounded percentage string. */
export function formatPercent(ratio: number, fractionDigits = 1): string {
  return `${(ratio * 100).toFixed(fractionDigits)}%`
}

/**
 * Splits an amount across weights without losing or inventing cents.
 *
 * Uses the largest-remainder method so the returned parts always sum exactly
 * to `total`, which is what lets a member statement balance to the cent.
 */
export function splitByWeights(total: Cents, weights: readonly number[]): Cents[] {
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  if (weightSum <= 0) {
    return weights.map(() => 0)
  }

  const exact = weights.map((weight) => (total * weight) / weightSum)
  const floored = exact.map((value) => Math.floor(value))
  let remainder = total - floored.reduce((sum, value) => sum + value, 0)

  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)

  const result = [...floored]
  for (const entry of order) {
    if (remainder <= 0) break
    result[entry.index] = (result[entry.index] ?? 0) + 1
    remainder -= 1
  }

  return result
}
