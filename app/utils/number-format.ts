// Compact number formatting helpers for Vietnamese dashboard charts
// Rules:
//  - < 1,000: plain number (no suffix)
//  - < 1,000,000: divide by 1,000 => suffix 'k' (no trailing .0)
//  - >= 1,000,000: divide by 1,000,000 => suffix 'tr' (triệu)
//  - Keep at most one decimal when value < 10 of its unit bucket, else no decimals
//  - Always strip trailing zeros
export function formatCompactVi(value: number | null | undefined): string {
  if (value == null || isNaN(value as number)) return '--'
  const abs = Math.abs(value)
  if (abs < 1000) return value.toString()
  if (abs < 1_000_000) {
    const base = value / 1000
    return formatWithUnit(base, 'k')
  }
  const base = value / 1_000_000
  return formatWithUnit(base, 'tr')
}

function formatWithUnit(num: number, unit: string): string {
  const abs = Math.abs(num)
  const decimals = abs < 10 ? 1 : 0
  let s = num.toFixed(decimals)
  if (decimals === 1) s = s.replace(/\.0$/, '')
  return s + unit
}

// Axis tick formatter for Chart.js
export function makeTickFormatter() {
  return (val: unknown) => {
    if (typeof val !== 'number') return val as string
    return formatCompactVi(val)
  }
}

// Tooltip value formatting (optionally append currency symbol)
export function formatTooltipValue(val: number, isMoney = false): string {
  if (val == null) return '--'
  if (isMoney) {
    // For money show more precise grouping with đ suffix
    return val.toLocaleString('vi-VN') + ' đ'
  }
  return formatCompactVi(val)
}
