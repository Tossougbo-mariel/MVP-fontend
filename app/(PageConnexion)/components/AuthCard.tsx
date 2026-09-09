"use client";

import { useRef } from "react";

export default function AuthCard({
  children,
}: {
  children: React.ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
  };

  return (
    <div
      className="relative max-w-md w-full mx-auto"
      style={{ perspective: "1000px" }}
    >
      {/* Bordure conic-gradient animée */}
      <div
        className="absolute -inset-px rounded-3xl"
        style={{
          background: "conic-gradient(from var(--angle), #F97316, #EC4899, #8B5CF6, #F97316)",
          animation: "border-spin 4s linear infinite",
        }}
      />

      {/* Carte glass */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-3xl p-8 transition-transform duration-100"
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