import { Building2, FolderKanban, ListTodo } from "lucide-react";

const steps = [
  {
    icon: Building2,
    step: "Étape 1",
    title: "Créez votre agence",
    description:
      "Créez votre agence en quelques secondes. Générez un lien d'invitation pour ajouter vos collaborateurs et commencez à structurer votre organisation.",
  },
  {
    icon: FolderKanban,
    step: "Étape 2",
    title: "Organisez vos projets",
    description:
      "Créez des projets par client ou par mission. Divisez-les en tâches claires, fixez des priorités et gardez une vision d'ensemble sur chaque avancement.",
  },
  {
    icon: ListTodo,
    step: "Étape 3",
    title: "Collaborez en équipe",
    description:
      "Assignez les tâches à vos membres, suivez les notifications, et pilotez l'activité de toute l'agence depuis un tableau de bord unique et simple.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="pt-10 pb-16 md:pt-14 md:pb-20 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-[#056cf21a] px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "#056cf2" }}>
            Comment ça marche
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl" style={{ color: "#0b1521", letterSpacing: "-0.02em" }}>
            Lancez-vous en trois étapes simples
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#056cf2]" />
          <p className="mt-4 text-lg font-medium" style={{ color: "#4B5767" }}>
            De la création de votre agence à la collaboration en équipe, vous
            êtes opérationnel en quelques minutes.
          </p>
        </div>

        <div className="relative mt-16">
          <div className="absolute left-1/2 top-6 hidden h-0.5 w-2/3 -translate-x-1/2 lg:block" style={{ background: "linear-gradient(90deg, transparent, #9dc7ff, transparent)" }} />
          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map(({ icon: Icon, step, title, description }) => (
              <div
                key={step}
                className="relative flex flex-col items-center text-center"
              >
                
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#f0f4ff", color: "#056cf2" }}>
                    <Icon size={22} />
                  
                </div>
                <span className="mt-4 text-sm font-semibold uppercase tracking-wider" style={{ color: "#056cf2" }}>
                  {step}
                </span>
                <h3 className="mt-2 text-xl font-bold" style={{ color: "#0b1521" }}>
                  {title}
                </h3>
                <p className="mt-3 max-w-sm text-base font-medium leading-7" style={{ color: "#4B5767" }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
