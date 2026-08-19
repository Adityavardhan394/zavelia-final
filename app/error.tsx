"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="legal-page">
      <div className="legal-container not-found">
        <p className="eyebrow">SOMETHING WENT WRONG</p>
        <h1>We hit a snag</h1>
        <p>
          Something unexpected happened while loading this page. Please try
          again — and if the problem persists, reach out to us on WhatsApp.
        </p>
        <button onClick={reset} className="legal-back" type="button">
          TRY AGAIN
        </button>
        <a href="/" className="legal-back" style={{ marginTop: 12 }}>
          ← BACK TO SHOP
        </a>
      </div>
    </main>
  );
}
