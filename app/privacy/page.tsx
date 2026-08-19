import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — ZAVÉLIA",
  description: "How ZAVÉLIA collects, uses and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <p className="eyebrow">LEGAL</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: August 17, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            ZAVÉLIA (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
            committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, and safeguard your personal information when
            you visit our website and place orders through our platform.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>We may collect the following information:</p>
          <ul>
            <li>Full name and delivery address</li>
            <li>Mobile number (for order confirmation via WhatsApp)</li>
            <li>PIN code for delivery purposes</li>
            <li>Email address (if you subscribe to our newsletter)</li>
            <li>
              Browser and device information (via standard web analytics)
            </li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>Your information is used to:</p>
          <ul>
            <li>Process and confirm orders through WhatsApp</li>
            <li>Arrange delivery of your purchases</li>
            <li>Send newsletter updates (only with your consent)</li>
            <li>Improve our website and customer experience</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Storage</h2>
          <p>
            Product catalogue data is stored securely using Cloudflare D1
            database services. Your order details are shared with us through
            WhatsApp and are subject to WhatsApp&apos;s own privacy policy. We do
            not store payment information as payment is arranged directly
            between you and ZAVÉLIA.
          </p>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          <p>
            We use WhatsApp (Meta) for order communication and Unsplash for
            product imagery. These services have their own privacy policies
            which we encourage you to review.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Request a copy of the personal data we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal data</li>
            <li>Unsubscribe from marketing communications at any time</li>
          </ul>
        </section>

        <section>
          <h2>7. Cookies</h2>
          <p>
            Our website uses localStorage to save your wishlist preferences. We
            do not use tracking cookies. Standard browser cookies may be set by
            the hosting platform for essential site functionality.
          </p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated revision date. Continued use of
            our website after changes constitutes acceptance of the revised
            policy.
          </p>
        </section>

        <section>
          <h2>9. Contact Us</h2>
          <p>
            For any privacy-related enquiries, please reach us at{" "}
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
