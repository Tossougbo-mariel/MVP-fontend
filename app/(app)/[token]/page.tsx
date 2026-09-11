"use client";

import Link from "next/link";

export default function TokenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="glass rounded-3xl p-8 text-center max-w-md w-full"
        style={{ color: "var(--text-primary)" }}
      >
        <p className="text-lg font-bold mb-2">Page en construction</p>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Cette page sera bientôt disponible. Revenez plus tard.
        </p>
        <Link
          href="/connexion"
          className="font-semibold"
          style={{
            backgroundImage: "linear-gradient(135deg, #056cf2, #9dc7ff)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}