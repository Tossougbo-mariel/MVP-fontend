"use client";

export default function AuthCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative max-w-md w-full mx-auto"
      style={{ perspective: "1000px" }}
    >
      {/* Bordure conic-gradient animée */}
      <div
        className="absolute -inset-px rounded-3xl"
        style={{
          background: "conic-gradient(from var(--angle), #0EA5E9, #3B82F6, #6366F1, #0EA5E9)",
          animation: "border-spin 4s linear infinite",
        }}
      />

      {/* Carte glass */}
      <div
        className="relative rounded-3xl p-8"
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