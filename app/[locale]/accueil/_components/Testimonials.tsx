import { useTranslations } from "next-intl";
import { Reveal } from "./Reveal";

const testimonials = [
  { key: "amina", name: "Amina Benali", initials: "AB", color: "var(--blue)" },
  { key: "karim", name: "Karim Haddad", initials: "KH", color: "var(--blue-accent)" },
  { key: "leila", name: "Leila Mansouri", initials: "LM", color: "var(--blue-mid)" },
  { key: "youssef", name: "Youssef Amrani", initials: "YA", color: "var(--blue-light)" },
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
  const t = useTranslations("Landing.testimonials");
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
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-[color:rgba(var(--blue-rgb),0.10)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--blue)" }}>
            {t("badge")}
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl" style={{ color: "#0b1521", letterSpacing: "-0.02em" }}>
            {t("title")}
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[color:var(--blue)]" />
          <p className="mt-4 text-lg font-medium" style={{ color: "#4B5767" }}>
            {t("subtitle")}
          </p>
        </Reveal>
      </div>

      {/* Carrousel */}
      <Reveal className="group relative mt-16 overflow-hidden" y={16}>
        <div
          className="animate-reviews-scroll flex w-max gap-5 px-4 group-hover:[animation-play-state:paused]"
          style={{ paddingBottom: "8px" }}
        >
          {items.map((item, index) => (
            <div
              key={`${item.key}-${index}`}
              className="flex w-[320px] shrink-0 flex-col gap-3.5 rounded-[20px] border bg-white p-7 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(var(--blue-rgb),0.12)]"
              style={{
                borderColor: "var(--blue)",
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
                      {t(`items.${item.key}.role`)}
                    </p>
                  </div>
                </div>
                <Stars />
              </div>
              <p
                className="text-sm font-medium leading-[1.6]"
                style={{
                  color: "#4B5767",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {t("quoted", { quote: t(`items.${item.key}.quote`) })}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}