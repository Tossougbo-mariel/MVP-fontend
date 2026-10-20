<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Internationalisation (i18n)

- Locales supportées : `fr` (défaut) et `en`. Routing `next-intl` avec `localePrefix: "always"` ; toutes les routes vivent sous `app/[locale]/`.
- Server Components : `getTranslations` / `getFormatter` depuis `next-intl/server`. Client Components : `useTranslations` / `useFormatter` depuis `next-intl`.
- Navigation : importer `Link`, `useRouter` et `redirect` **uniquement** depuis `@/i18n/navigation`. `useParams` / `useSearchParams` restent dans `next/navigation`.
- Toute chaîne visible par l'utilisateur passe par `messages/fr.json` et `messages/en.json`. Aucune chaîne d'UI en dur.
- Namespaces disponibles : `Metadata`, `Common`, `Navigation`, `Auth`, `Validation`, `Errors`, `Landing`, `Dashboard`, `Agencies`, `Projects`, `Tasks`, `Team`, `Planning`, `Notifications`, `Deadlines`, `Profile`, `Settings`, `Statuses`, `Priorities`, `ProjectStatuses`, `DeadlineStatuses`, `NotificationTypes`, `Colors`, `Dates`.
- Clés sémantiques (ex. `auth.login.title`), jamais le texte français comme clé.
- ICU pour l'interpolation (`{name}`), les pluriels (`{count, plural, …}`) et `t.rich` pour le JSX embarqué.
- Dates, heures et nombres : jamais de locale en dur (`"fr-FR"`). Utiliser `useFormatter` / `getFormatter` ou `Intl` avec la locale active.
- Les fonctions de `lib/` exposent des **clés** de traduction, pas des libellés. Les libellés ne sont résolus qu'au moment de l'affichage.
- Les données utilisateur (titres de projets/tâches, noms d'agence) ne sont jamais traduites.
- Toute nouvelle clé doit être ajoutée **en fr et en** dans le même changement.

