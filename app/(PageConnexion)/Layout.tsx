"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: "var(--bg-obsidian)" }}
    >
      {/* Aurora blobs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: "#F97316",
          filter: "blur(120px)",
          animation: "aurora-drift 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[30%] right-[-15%] w-[700px] h-[700px] rounded-full opacity-20"
        style={{
          background: "#EC4899",
          filter: "blur(120px)",
          animation: "aurora-drift 25s ease-in-out infinite",
          animationDelay: "-5s",
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: "#8B5CF6",
          filter: "blur(120px)",
          animation: "aurora-drift 30s ease-in-out infinite",
          animationDelay: "-10s",
        }}
      />
      <div
        className="absolute top-[10%] left-[40%] w-[400px] h-[400px] rounded-full opacity-10"
        style={{
          background: "#FCD34D",
          filter: "blur(120px)",
          animation: "aurora-drift 35s ease-in-out infinite",
          animationDelay: "-15s",
        }}
      />

      {/* Particules flottantes */}
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          
          style={{
            width: `${Math.random() * 2 + 2}px`,
            height: `${Math.random() * 2 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.1 + 0.05,
            animation: `float-up ${Math.random() * 7 + 8}s linear infinite`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}

      {/* Contenu */}
      <div className="relative z-10 w-full px-4">{children}</div>
    </div>
  );
}