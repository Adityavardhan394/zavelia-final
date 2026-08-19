"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();

      if (!r.ok) {
        setError(d.error || "Login failed.");
        setLoading(false);
        return;
      }

      /* Server sets HttpOnly cookie; redirect to admin dashboard */
      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <a href="/" className="logo">
            ZAVÉLIA<span>adorn your every mood</span>
          </a>
          <p className="admin-login-subtitle">Management Console</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <h2>Admin Sign In</h2>

          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="admin-login-error">{error}</p>}

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>

          <a href="/" className="admin-login-back">
            &larr; Back to store
          </a>
        </form>
      </div>

      <style>{`
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f6f3;
          padding: 2rem;
        }
        .admin-login-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          max-width: 420px;
          width: 100%;
          overflow: hidden;
        }
        .admin-login-brand {
          text-align: center;
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid #eee;
        }
        .admin-login-brand .logo {
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #1a1a1a;
          text-decoration: none;
          display: block;
        }
        .admin-login-brand .logo span {
          display: block;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          color: #888;
          margin-top: 0.25rem;
        }
        .admin-login-subtitle {
          font-size: 0.8rem;
          color: #999;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top: 0.5rem;
        }
        .admin-login-form {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .admin-login-form h2 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #1a1a1a;
        }
        .admin-login-form label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: #555;
        }
        .admin-login-form input {
          padding: 0.7rem 0.9rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .admin-login-form input:focus {
          outline: none;
          border-color: #1a1a1a;
        }
        .admin-login-error {
          color: #d32f2f;
          font-size: 0.85rem;
          background: #fef2f2;
          padding: 0.6rem 0.8rem;
          border-radius: 6px;
          margin: 0;
        }
        .admin-login-btn {
          padding: 0.8rem;
          background: #1a1a1a;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 0.5rem;
        }
        .admin-login-btn:hover {
          background: #333;
        }
        .admin-login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .admin-login-back {
          text-align: center;
          font-size: 0.85rem;
          color: #888;
          text-decoration: none;
          transition: color 0.2s;
        }
        .admin-login-back:hover {
          color: #1a1a1a;
        }
      `}</style>
    </div>
  );
}
