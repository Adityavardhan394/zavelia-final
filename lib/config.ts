/** Centralized business configuration for ZAVÉLIA. */
export const BUSINESS = {
  name: "ZAVÉLIA",
  tagline: "adorn your every mood",
  whatsapp: "919063266307",
  email: "adityavardhan394@gmail.com",
  freeShippingMin: 999,
  shippingCost: 49,
  currency: "INR",
  currencySymbol: "₹",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://zavelia.in",
  adminEmails: ["padbhog@gmail.com", "adityavardhan394@gmail.com"],
} as const;

export const ORDER_STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CATEGORIES = ["Jewellery", "Beauty", "Accessories"] as const;
export type Category = (typeof CATEGORIES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function calcShipping(subtotal: number): number {
  return subtotal >= BUSINESS.freeShippingMin ? 0 : BUSINESS.shippingCost;
}

export function generateOrderRef(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ZAV-${date}-${rand}`;
}
