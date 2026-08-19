export default function NotFound() {
  return (
    <main className="legal-page">
      <div className="legal-container not-found">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have been
          moved. Let&rsquo;s get you back to browsing beautiful things.
        </p>
        <a href="/" className="legal-back">
          ← BACK TO SHOP
        </a>
      </div>
    </main>
  );
}
