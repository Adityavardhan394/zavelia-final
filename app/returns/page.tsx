import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Refunds — ZAVÉLIA",
  description: "ZAVÉLIA returns, exchanges and refund policy for a worry-free experience.",
};

export default function ReturnsPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <p className="eyebrow">HELP</p>
        <h1>Returns &amp; Refunds</h1>
        <p className="legal-updated">Last updated: August 17, 2026</p>

        <section>
          <h2>7-Day Easy Returns</h2>
          <p>
            We want you to love every piece from ZAVÉLIA. If something
            doesn&rsquo;t work out, you can request a return within{" "}
            <strong>7 days of delivery</strong>.
          </p>
        </section>

        <section>
          <h2>Eligibility for Returns</h2>
          <p>To be eligible for a return, items must be:</p>
          <ul>
            <li>Unused and in their original condition</li>
            <li>In original packaging with all tags attached</li>
            <li>
              Free from damage caused by misuse, wear, or accidental handling
            </li>
          </ul>
          <p>
            Beauty and personal care products can only be returned if the
            packaging is sealed and unopened, for hygiene reasons.
          </p>
        </section>

        <section>
          <h2>How to Initiate a Return</h2>
          <ol>
            <li>
              Message us on WhatsApp at{" "}
              <a
                href="https://wa.me/919063266307"
                target="_blank"
                rel="noopener noreferrer"
              >
                +91 90632 66307
              </a>{" "}
              with your order reference and reason for return.
            </li>
            <li>
              We will review your request and share return shipping instructions
              within 24 hours.
            </li>
            <li>
              Once we receive and inspect the returned item, we will process
              your refund or exchange.
            </li>
          </ol>
        </section>

        <section>
          <h2>Refund Process</h2>
          <ul>
            <li>
              Refunds are processed within <strong>5–7 business days</strong>{" "}
              of receiving and inspecting the returned item.
            </li>
            <li>
              Refunds will be issued to the original payment method used for
              the order.
            </li>
            <li>
              Original shipping charges are non-refundable unless the return is
              due to a defect or error on our part.
            </li>
          </ul>
        </section>

        <section>
          <h2>Exchanges</h2>
          <p>
            We currently do not offer direct exchanges. Please return the
            original item and place a new order for your preferred product.
          </p>
        </section>

        <section>
          <h2>Damaged or Incorrect Items</h2>
          <p>
            If you receive a damaged or incorrect item, please contact us
            immediately with photos of the product and packaging. We will
            arrange a replacement or full refund, including return shipping
            costs.
          </p>
        </section>

        <section>
          <h2>Need Help?</h2>
          <p>
            Reach out to us via WhatsApp at{" "}
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
            </a>
            . We&rsquo;re here to help.
          </p>
        </section>

        <a href="/" className="legal-back">
          ← BACK TO SHOP
        </a>
      </div>
    </main>
  );
}
