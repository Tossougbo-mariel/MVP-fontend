"use client";

function Avatar({ initials, gradient }: { initials: string; gradient: string }) {
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white text-[6px] font-bold text-white"
      style={{ background: gradient }}
    >
      {initials}
    </span>
  );
}

const GRAD = {
  blue: "linear-gradient(135deg,var(--blue),var(--blue-light))",
  lightBlue: "linear-gradient(135deg,var(--blue-light),var(--blue-mid))",
  dark: "linear-gradient(135deg,#011648,#002989)",
};

function TaskCard({
  title,
  tag,
  tagVariant = "neutral",
  progress,
  avatar,
  due,
  priority,
  done,
  active,
}: {
  title: string;
  tag?: string;
  tagVariant?: "blue" | "coral" | "neutral";
  progress?: number;
  avatar?: { initials: string; gradient: string };
  due?: string;
  priority?: boolean;
  done?: boolean;
  active?: boolean;
}) {
  const tagStyle = {
    blue: { bg: "#e8f0fe", color: "var(--blue)" },
    coral: { bg: "#fef1e6", color: "#e05d2b" },
    neutral: { bg: "#ebeae4", color: "#6B6F6A" },
  }[tagVariant];

  return (
    <div
      className="mb-1.5 rounded-lg bg-white p-1.5"
      style={{
        border: "1px solid #dfe5ed",
        borderLeft: active ? "3px solid var(--blue)" : "1px solid #dfe5ed",
      }}
    >
      <div className="flex items-center gap-1">
        {done && (
          <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-[7px] font-bold text-white">
            ✓
          </span>
        )}
        {priority && !done && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" />
        )}
        <p
          className="text-[7.5px] font-bold leading-tight"
          style={{
            color: done ? "#9A998F" : "#1C2321",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {title}
        </p>
      </div>

      {tag && (
        <span
          className="mt-1 inline-block rounded-full px-1.5 py-px text-[5.5px] font-bold"
          style={{ backgroundColor: tagStyle.bg, color: tagStyle.color }}
        >
          {tag}
        </span>
      )}

      {typeof progress === "number" && (
        <div className="mt-1 h-[2.5px] w-full overflow-hidden rounded-full bg-[#EBEAE4]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: done ? "#22c55e" : "var(--blue)",
            }}
          />
        </div>
      )}

      {(avatar || due) && (
        <div className="mt-1 flex items-center justify-between">
          {avatar ? <Avatar {...avatar} /> : <span />}
          {due && (
            <span className="text-[5.5px] font-semibold text-[#8A897F]">
              {due}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Column({
  label,
  count,
  dot,
  children,
}: {
  label: string;
  count: number;
  dot: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col rounded-md p-1.5"
      style={{ backgroundColor: "#EFEEE8" }}
    >
      <div className="mb-1 flex items-center gap-1 px-0.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dot }}
        />
        <p className="text-[6px] font-bold tracking-wide text-[#6B6F6A]">
          {label}
        </p>
        <span className="ml-auto rounded-full bg-white px-1 text-[5.5px] font-bold text-[#6B6F6A]">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function PhoneMockup() {
  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ fontFamily: "var(--font-manrope)" }}
    >
      {/* En-tête app */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: "linear-gradient(90deg, #011648, #002989)" }}
      >
        <p className="text-[8.5px] font-extrabold text-white">
          MVP{" "}
          <span style={{ color: "var(--blue-light)" }}>Manager</span>
        </p>
        <Avatar initials="AK" gradient={GRAD.blue} />
      </div>

      <div
        className="flex flex-1 overflow-hidden"
        style={{ backgroundColor: "#F3F3EF" }}
      >
        {/* Kanban */}
        <div className="flex flex-1 flex-col overflow-hidden p-2">
          <div className="mb-1.5">
            <p className="text-[8.5px] font-extrabold text-[#1C2321]">
              Site web ABC Immobilier
            </p>
            <div className="mt-1 h-[2.5px] w-24 overflow-hidden rounded-full bg-[#EBEAE4]">
              <div className="h-full w-3/4 rounded-full bg-[color:var(--blue)]" />
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-1.5 overflow-hidden">
            <Column label="À FAIRE" count={1} dot="#8A897F">
              <TaskCard
                title="Formulaire contact"
                tag="Moyenne"
                tagVariant="neutral"
                avatar={{ initials: "KE", gradient: GRAD.lightBlue }}
                due="20/09"
              />
            </Column>
            <Column label="EN COURS" count={2} dot="var(--blue)">
              <TaskCard
                title="API utilisateurs"
                tag="Haute"
                tagVariant="coral"
                progress={45}
                active
                avatar={{ initials: "DA", gradient: GRAD.blue }}
                due="18/09"
              />
              <TaskCard
                title="Page des biens"
                progress={60}
                avatar={{ initials: "KE", gradient: GRAD.lightBlue }}
                due="18/09"
              />
            </Column>
            <Column label="EN RÉVISION" count={1} dot="var(--blue-mid)">
              <TaskCard
                title="Page d'accueil"
                tag="Haute"
                tagVariant="coral"
                priority
                avatar={{ initials: "DA", gradient: GRAD.blue }}
                due="15/09"
              />
            </Column>
            <Column label="TERMINÉE" count={1} dot="#22c55e">
              <TaskCard
                title="Maquette accueil"
                done
                progress={100}
                avatar={{ initials: "SA", gradient: GRAD.lightBlue }}
              />
            </Column>
          </div>
        </div>
      </div>
    </div>
  );
}
