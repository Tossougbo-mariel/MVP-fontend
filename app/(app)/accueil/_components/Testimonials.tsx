const testimonials = [
  {
    quote:
      "MVP Manager a transformé notre façon de travailler. Toutes nos agences et projets sont enfin centralisés au même endroit.",
    name: "Amina Benali",
    role: "Directrice · Agence Créative",
    initials: "AB",
    color: "#056cf2",
  },
  {
    quote:
      "Le suivi des tâches est limpide. Chaque membre de l'équipe sait exactement quoi faire et où en est chaque projet.",
    name: "Karim Haddad",
    role: "Chef de projet · Studio Digital",
    initials: "KH",
    color: "#0c79f2",
  },
  {
    quote:
      "Simple, rapide et efficace. Gain de temps énorme.",
    name: "Leila Mansouri",
    role: "Fondatrice · Web Studio",
    initials: "LM",
    color: "#589bff",
  },
  {
    quote:
      "La vision d'ensemble qu'on a enfin sur tous nos projets. Le dashboard est clair, les notifications sont pertinentes.",
    name: "Youssef Amrani",
    role: "Directeur technique · Agence Web",
    initials: "YA",
    color: "#9dc7ff",
  },
];

function Stars() {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="#f5a623"
          stroke="none"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const items = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-20" style={{ background: "#f4f6fa" }}>
      {/* Fade gauche */}
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 h-full"
        style={{
          width: "80px",
          background: "linear-gradient(90deg, #f4f6fa 0%, transparent 100%)",
        }}
      />

      {/* Fade droite */}
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-full"
        style={{
          width: "80px",
          background: "linear-gradient(270deg, #f4f6fa 0%, transparent 100%)",
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-[#056cf21a] px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "#056cf2" }}>
            Témoignages
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl" style={{ color: "#0b1521", letterSpacing: "-0.02em" }}>
            Ils utilisent MVP Manager au quotidien
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#056cf2]" />
          <p className="mt-4 text-lg" style={{ color: "#5e6773" }}>
            Nos clients gèrent leurs agences, projets et équipes avec succès.
          </p>
        </div>
      </div>

      {/* Carrousel */}
      <div className="group relative mt-16 overflow-hidden">
        <div
          className="animate-reviews-scroll flex w-max gap-5 px-4 group-hover:[animation-play-state:paused]"
          style={{ paddingBottom: "8px" }}
        >
          {items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex w-[320px] shrink-0 flex-col gap-3.5 rounded-[20px] border bg-white p-7 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_#056cf21f]"
              style={{
                borderColor: "#056cf2",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                    style={{ background: item.color }}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: "#0b1521" }}>
                      {item.name}
                    </p>
                    <p className="text-[11px]" style={{ color: "#5e6773" }}>
                      {item.role}
                    </p>
                  </div>
                </div>
                <Stars />
              </div>
              <p
                className="text-sm leading-[1.6]"
                style={{
                  color: "#5e6773",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                &laquo; {item.quote} &raquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
