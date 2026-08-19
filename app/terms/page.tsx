import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — ZAVÉLIA",
  description: "Terms and conditions for using the ZAVÉLIA online store.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <p className="eyebrow">LEGAL</p>
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: August 17, 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the ZAVÉLIA website, you agree to be bound by
            these Terms of Service. If you do not agree to these terms, please
            do not use our website.
          </p>
        </section>

        <section>
          <h2>2. Products and Pricing</h2>
          <ul>
            <li>
              All prices are listed in Indian Rupees (₹) and are inclusive of
              applicable taxes unless stated otherwise.
            </li>
            <li>
              We reserve the right to modify prices at any time without prior
              notice.
            </li>
            <li>
              Product images are for illustration purposes. Actual products may
              vary slightly in colour due to screen settings and photography.
            </li>
            <li>
              Product availability is subject to stock levels. We reserve the
              right to cancel orders if a product becomes unavailable.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Ordering Process</h2>
          <ul>
            <li>
              Orders are placed through WhatsApp for confirmation and payment
              arrangement.
            </li>
            <li>
              Opening WhatsApp with your order details does not constitute a
              confirmed order.
            </li>
            <li>
              Orders are confirmed only after ZAVÉLIA reviews availability and
              responds to your message.
            </li>
            <li>
              We reserve the right to refuse or cancel any order at our
              discretion.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Shipping</h2>
          <ul>
            <li>Standard shipping is ₹49 for orders below ₹999.</li>
            <li>Complimentary shipping is provided for orders of ₹999 and above.</li>
            <li>
              Delivery timelines are estimates and may vary based on location
              and courier availability.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Returns and Refunds</h2>
          <p>
            Please refer to our{" "}
            <a href="/returns">Returns &amp; Refunds Policy</a> for complete
            details on eligible returns, conditions, and the refund process.
          </p>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>
            All content on this website — including text, images, logos,
            graphics, and design elements — is the property of ZAVÉLIA and is
            protected by applicable intellectual property laws. You may not
            reproduce, distribute, or use any content without our prior written
            permission.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            ZAVÉLIA shall not be liable for any indirect, incidental, or
            consequential damages arising from the use of our website or
            products. Our total liability shall not exceed the purchase price of
            the product in question.
          </p>
        </section>

        <section>
          <h2>8. Governing Law</h2>
          <p>
            These Terms of Service are governed by the laws of India. Any
            disputes shall be subject to the jurisdiction of the courts in
            India.
          </p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>
            For questions regarding these terms, please contact us at{" "}
            <a href="mailto:adityavardhan394@gmail.com">
              adityavardhan394@gmail.com
            </a>{" "}
            or via WhatsApp at{" "}
            <a
              href="https://wa.me/919063266307"
              target="_blank"
              rel="noopener noreferrer"
            >
              +91 90632 66307
            </a>
            .
          </p>
        </section>

        <a href="/" className="legal-back">
          ← BACK TO SHOP
        </a>
      </div>
    </main>
  );
}
