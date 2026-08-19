import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy — ZAVÉLIA",
  description: "Shipping rates, delivery timelines and coverage for ZAVÉLIA orders.",
};

export default function ShippingPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <p className="eyebrow">HELP</p>
        <h1>Shipping Policy</h1>
        <p className="legal-updated">Last updated: August 17, 2026</p>

        <section>
          <h2>Shipping Rates</h2>
          <ul>
            <li>
              <strong>Orders below ₹999:</strong> Standard shipping charge of
              ₹49 applies.
            </li>
            <li>
              <strong>Orders ₹999 and above:</strong> Complimentary shipping —
              no delivery charge.
            </li>
          </ul>
        </section>

        <section>
          <h2>Delivery Coverage</h2>
          <p>
            We currently ship to addresses across India. Delivery to remote or
            restricted PIN codes may take additional time or may not be
            available. Please provide a valid 6-digit PIN code at checkout.
          </p>
        </section>

        <section>
          <h2>Order Processing</h2>
          <ul>
            <li>
              Orders are confirmed through WhatsApp after we verify product
              availability.
            </li>
            <li>
              Once confirmed, orders are typically processed and dispatched
              within 1–3 business days.
            </li>
            <li>
              You will receive a dispatch confirmation with tracking details
              where available.
            </li>
          </ul>
        </section>

        <section>
          <h2>Estimated Delivery Timelines</h2>
          <ul>
            <li>
              <strong>Metro cities:</strong> 3–5 business days after dispatch
            </li>
            <li>
              <strong>Non-metro areas:</strong> 5–7 business days after dispatch
            </li>
            <li>
              <strong>Remote areas:</strong> 7–10 business days after dispatch
            </li>
          </ul>
          <p>
            These are estimates and actual delivery times may vary based on
            courier partner schedules and local conditions.
          </p>
        </section>

        <section>
          <h2>Tracking Your Order</h2>
          <p>
            Once your order is dispatched, we will share tracking information via
            WhatsApp. You can also reach out to us at any time for status
            updates.
          </p>
        </section>

        <section>
          <h2>Delivery Issues</h2>
          <p>
            If your order has not arrived within the estimated timeframe, please
            contact us via WhatsApp at{" "}
            <a
              href="https://wa.me/919063266307"
              target="_blank"
              rel="noopener noreferrer"
            >
              +91 90632 66307
            </a>{" "}
            or email{" "}
            <a href="mailto:adityavardhan394@gmail.com">
              adityavardhan394@gmail.com
            </a>{" "}
            and we will investigate promptly.
          </p>
        </section>

        <a href="/" className="legal-back">
          ← BACK TO SHOP
        </a>
      </div>
    </main>
  );
}
