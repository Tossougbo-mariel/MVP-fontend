"use client";

export default function AuthCard({
  children,
  className = "",
  padding = "p-8",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div
      className={`relative max-w-md w-full mx-auto ${className}`}
      style={{ perspective: "1000px" }}
    >
      {/* Bordure conic-gradient animée */}
      <div
        className="absolute -inset-px rounded-3xl"
        style={{
          background: "conic-gradient(from var(--angle), var(--blue), var(--blue-mid), var(--blue-light), var(--blue))",
          animation: "border-spin 4s linear infinite",
        }}
      />

      {/* Carte glass */}
      <div
        className={`relative rounded-3xl ${padding}`}
        style={{
          background: "var(--card-bg)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {children}
      </div>
    </div>
  );
}