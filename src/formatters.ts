export function formatCurrency(n: number): string {
  if (n === 0) return '—'
  if (Math.abs(n) >= 1_000_000) {
    return '$' + (n / 1_000_000).toFixed(2) + 'M'
  }
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatCurrencyFull(n: number): string {
  if (n === 0) return '—'
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatPercent(n: number): string {
  return (n * 100).toFixed(2) + '%'
}
