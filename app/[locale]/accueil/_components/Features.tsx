"use client";

import {
  Building2,
  FolderKanban,
  ListTodo,
  Users,
  Bell,
  Settings,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { useTranslations } from "next-intl";

const features = [
    { key: "multiAgency", icon: Building2 },
    { key: "projects", icon: FolderKanban },
    { key: "tasks", icon: ListTodo },
    { key: "team", icon: Users },
    { key: "notifications", icon: Bell },
    { key: "settings", icon: Settings },
];

export default function Features() {
  const t = useTranslations("Landing.features");
  return (
    <section id="features" className="pt-10 pb-16 md:pt-14 md:pb-20" style={{ background: "#f4f6fa" }}>
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

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ key, icon: Icon }, i) => (
            <Reveal key={key} className="h-full" delay={(i % 3) * 0.08}>
              <div
                className="group h-full rounded-[20px] border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(var(--blue-rgb),0.12)]"
                style={{
                  borderColor: "#dfe5ed",
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
                  style={{ background: "#f0f4ff" }}
                >
                  <Icon size={22} style={{ color: "var(--blue)" }} />
                </div>
                <h3 className="mt-5 text-lg font-bold" style={{ color: "#0b1521" }}>
                  {t(`items.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm font-medium leading-6" style={{ color: "#4B5767" }}>
                  {t(`items.${key}.description`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
