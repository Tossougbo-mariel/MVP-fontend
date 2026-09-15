import {
  Building2,
  FolderKanban,
  ListTodo,
  Users,
  Bell,
  Settings,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Multi-agences",
    description:
      "Gérez plusieurs agences depuis un seul compte avec une navigation claire entre chacune d'elles.",
  },
  {
    icon: FolderKanban,
    title: "Gestion de projets",
    description:
      "Créez des projets, suivez leur avancement et gardez une vision d'ensemble sur toutes vos missions.",
  },
  {
    icon: ListTodo,
    title: "Suivi des tâches",
    description:
      "Organisez vos tâches par statut, priorité ou membre. Plus rien ne passe à la trappe.",
  },
  {
    icon: Users,
    title: "Gestion d'équipe",
    description:
      "Invitez vos collaborateurs, définissez les rôles et visualisez l'activité de chacun.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description:
      "Restez informé des nouvelles tâches, commentaires et changements importants en temps réel.",
  },
  {
    icon: Settings,
    title: "Paramètres avancés",
    description:
      "Personnalisez vos agences, gérez les permissions et adaptez l'outil à votre façon de travailler.",
  },
];

export default function Features() {
  return (
    <section id="features" className="pt-10 pb-16 md:pt-14 md:pb-20" style={{ background: "#f4f6fa" }}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-[#056cf21a] px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: "#056cf2" }}>
            Fonctionnalités
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl" style={{ color: "#0b1521", letterSpacing: "-0.02em" }}>
            Tout ce qu&apos;il faut pour piloter vos projets
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#056cf2]" />
          <p className="mt-4 text-lg font-medium" style={{ color: "#4B5767" }}>
            Un outil complet, pensé pour les agences et les équipes qui veulent
            avancer vite et bien.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-[20px] border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_#056cf21f]"
              style={{
                borderColor: "#dfe5ed",
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
                style={{ background: "#f0f4ff" }}
              >
                <Icon size={22} style={{ color: "#056cf2" }} />
              </div>
              <h3 className="mt-5 text-lg font-bold" style={{ color: "#0b1521" }}>
                {title}
              </h3>
              <p className="mt-2 text-sm font-medium leading-6" style={{ color: "#4B5767" }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
