/**
 * Coupon price breakdown for VAT-inclusive totals.
 *
 * The SAME maths lives in waitzeros-lambdas `mastercuts-book-slot/utils/pricing.mjs`
 * (authoritative — it decides what the booking stores) and wait-zeroes
 * `src/utils/pricing.ts`. Keep all three in step.
 *
 * Catalog prices are VAT-inclusive (UAE 5%). A coupon reduces the taxable
 * value, so VAT is charged on the discounted amount:
 *
 *   gross 105.00 → 15% → total 89.25 = net 85.00 + VAT 4.25
 *   shown as: Subtotal 100.00 · VAT 4.25 · Coupon −15.00 · Total 89.25
 *
 * With pct = 0 the figures equal the pre-coupon display (subtotal = gross/1.05,
 * VAT = gross − subtotal), so a coupon-less cart renders exactly as before.
 */
export const round2 = (n: number) =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export interface PriceBreakdown {
  gross: number;          // sum of the VAT-inclusive line prices
  discountGross: number;  // coupon amount, VAT-inclusive
  total: number;          // payable
  subtotalNet: number;    // gross excl. VAT
  discountNet: number;    // coupon amount excl. VAT (the row shown)
  net: number;            // payable excl. VAT
  vat: number;            // VAT on the payable amount
}

export function priceBreakdown(gross: number, pct = 0, vatRatePercent = 5): PriceBreakdown {
  const g = round2(gross || 0);
  const p = Number(pct) > 0 ? Number(pct) : 0;
  const discountGross = p ? round2((g * p) / 100) : 0;
  const total = round2(g - discountGross);
  const divisor = 1 + (Number(vatRatePercent) || 0) / 100;
  const net = round2(total / divisor);
  const vat = round2(total - net);
  const subtotalNet = round2(g / divisor);
  const discountNet = round2(subtotalNet - net);
  return { gross: g, discountGross, total, subtotalNet, discountNet, net, vat };
}
