"use client";

import { Building2, FolderKanban, ListTodo } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";

const steps = [
  { key: "createAgency", icon: Building2 },
  { key: "organizeProjects", icon: FolderKanban },
  { key: "collaborate", icon: ListTodo },
];

export default function HowItWorks() {
  const t = useTranslations("Landing.howItWorks");

  return (
    <section id="how-it-works" className="pt-10 pb-16 md:pt-14 md:pb-20 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
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
        </div>

        <div className="relative mt-16">
          <div className="absolute left-1/2 top-6 hidden w-2/3 -translate-x-1/2 lg:block">
            <Reveal y={0}>
              <div
                className="h-0.5 w-full"
                style={{ background: "linear-gradient(90deg, transparent, var(--blue-light), transparent)" }}
              />
            </Reveal>
          </div>
          <RevealGroup className="grid gap-8 lg:grid-cols-3">
            {steps.map(({ key, icon: Icon }, i) => (
              <RevealItem
                key={key}
                className="relative flex flex-col items-center text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#f0f4ff", color: "var(--blue)" }}>
                  <Icon size={22} />
                </div>
                <span className="mt-4 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--blue)" }}>
                  {t("stepLabel", { number: i + 1 })}
                </span>
                <h3 className="mt-2 text-xl font-bold" style={{ color: "#0b1521" }}>
                  {t(`steps.${key}.title`)}
                </h3>
                <p className="mt-3 max-w-sm text-base font-medium leading-7" style={{ color: "#4B5767" }}>
                  {t(`steps.${key}.description`)}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}