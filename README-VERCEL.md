# ZAVÉLIA — Vercel Deployment

This storefront is ready to connect to a GitHub repository and import into Vercel.

## Deploy

1. Push this project to GitHub.
2. In Vercel, select **Add New → Project** and import the repository.
3. Keep the detected framework as **Next.js**.
4. Deploy. No environment variables are required for the current WhatsApp ordering flow.

## Ordering configuration

- WhatsApp: `+91 90632 66307`
- Customer care: `adityavardhan394@gmail.com`
- Free-shipping threshold: ₹999
- Standard shipping below threshold: ₹49

The browser creates a unique order reference and opens WhatsApp with the customer-entered delivery details and server-defined catalogue totals. WhatsApp opening is an order request, not payment or final confirmation.

## Before accepting public orders

- Replace demonstration products and images with actual catalogue information.
- Verify prices, stock, shipping and returns terms.
- Add final Privacy, Terms, Shipping and Returns pages reviewed for the business.
- For inventory reservation, admin management and persistent orders, connect a production database and server-side order API.
