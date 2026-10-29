# Guide de fonctionnement du frontend MVP

## 1. À quoi sert le frontend ?

Le frontend est l’interface web de la plateforme de gestion de projets et de tâches. Il permet aux utilisateurs de créer un compte, rejoindre une agence, travailler sur ses projets, organiser les tâches et consulter les notifications. Les écrans sont construits avec Next.js, React et TypeScript. Les données métier sont fournies par le backend Laravel au moyen d’une API HTTP.

## 2. Parcours général d’un utilisateur

1. **Découvrir la plateforme** : la page d’accueil présente le service et ses principales fonctions.
2. **Créer un compte ou se connecter** : l’utilisateur peut s’inscrire, utiliser son adresse courriel et son mot de passe, demander un code de connexion, ou passer par Google lorsque le backend et la configuration Google sont disponibles. Une vérification en deux étapes peut demander un code supplémentaire.
3. **Accéder à son espace** : une fois connecté, l’utilisateur arrive dans l’espace applicatif. Les pages protégées vérifient la session avant d’afficher les données.
4. **Choisir ou créer une agence** : l’agence sert d’espace de travail partagé. L’utilisateur peut consulter ses agences, en créer une ou accepter une invitation.
5. **Gérer le travail** : dans une agence, les membres consultent le tableau de bord, les projets, les tâches, l’équipe, le planning et les notifications.

## 3. Organisation des espaces

### Espace personnel et navigation générale

Les pages principales donnent accès au tableau de bord, à la liste des agences, au profil, aux réglages, aux notifications et aux alertes. La barre latérale et l’en-tête permettent de naviguer entre les sections et l’agence active.

### Espace d’une agence

Chaque agence possède ses propres vues de travail :

- **Tableau de bord** : vue synthétique de l’activité de l’agence.
- **Projets** : liste des projets et création d’un projet.
- **Détail d’un projet** : informations du projet, tâches, vue Kanban et planning.
- **Mes tâches** : tâches attribuées à l’utilisateur dans l’agence.
- **Équipe** : membres, invitations et actions permises selon le rôle.
- **Paramètres** : réglages propres à l’agence.
- **Notifications et alertes** : événements et échéances à suivre.

Un projet contient des tâches. Les tâches peuvent être consultées individuellement et organisées dans une vue Kanban ou un planning. Lors de la création d’un projet, la date d’échéance doit être égale ou postérieure à la date de début.

### Invitations et équipe

Un membre peut être invité à rejoindre une agence depuis la gestion de l’équipe. Le lien d’invitation ouvre le parcours d’acceptation. Après acceptation, les données d’agence sont rechargées afin que l’agence nouvellement rejointe apparaisse correctement. Les possibilités de gestion des membres dépendent du rôle du compte et des règles appliquées par le backend.

## 4. Connexion au backend et gestion de session

Les appels HTTP sont centralisés dans `lib/api.ts` et les opérations métier dans `lib/services.ts` et `lib/auth.ts`. L’URL de l’API est configurée avec `NEXT_PUBLIC_API_URL` ; à défaut, le frontend utilise le chemin `/api`.

Le jeton de session est conservé côté navigateur dans le stockage local sous la clé `mvp-auth`. L’API ajoute ce jeton aux requêtes authentifiées. Si une requête protégée reçoit une réponse 401, le frontend efface la session et redirige l’utilisateur vers la page de connexion. Les erreurs renvoyées par l’API sont transformées en messages affichables.

Les données partagées entre pages sont gérées par le fournisseur `AppDataProvider` (`lib/appData.tsx`). Il charge les informations de l’utilisateur et de ses espaces, puis les met à disposition des vues. Certaines données sont mises en cache pour éviter de répéter les mêmes chargements ; le cache est invalidé lorsqu’un changement exige un rechargement, par exemple après l’acceptation d’une invitation.

## 5. Langues et adresses des pages

L’interface prend en charge le français (`fr`) et l’anglais (`en`). La langue est présente dans l’adresse de chaque page. Les textes traduits se trouvent dans `messages/fr.json` et `messages/en.json`, et le routage correspondant est défini dans `i18n/routing.ts`. Les noms de projets, tâches et agences saisis par les utilisateurs restent leurs données et ne sont pas traduits automatiquement.

## 6. Dossiers et fichiers à connaître

| Emplacement | Rôle |
| --- | --- |
| `app/[locale]/` | Pages et mises en page, organisées par langue |
| `app/[locale]/(PageConnexion)/` | Inscription, connexion, mot de passe et invitations |
| `app/[locale]/(app)/` | Pages authentifiées de l’application |
| `app/[locale]/(app)/agences/[agencyId]/` | Fonctions associées à une agence |
| `app/[locale]/(app)/components/` | Navigation, éléments partagés et composants d’application |
| `lib/api.ts` | Client HTTP et traitement commun des réponses d’erreur |
| `lib/auth.ts` | Opérations liées à l’authentification |
| `lib/services.ts` | Appels de services métier vers l’API |
| `lib/appData.tsx` | Chargement, partage et cache des données d’application |
| `i18n/` et `messages/` | Configuration des langues et textes traduits |
| `app/store/` | État client partagé, notamment session et alertes |

## 7. Démarrer le frontend en local

Depuis le dossier du dépôt frontend :

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`. Le fichier `.env.local` doit contenir les variables d’environnement adaptées à l’installation, notamment l’URL de l’API du backend (`NEXT_PUBLIC_API_URL`). Ne partagez pas les secrets contenus dans les fichiers d’environnement.

Les scripts disponibles dans `package.json` sont : `npm run dev` pour le développement, `npm run build` pour la compilation, `npm run start` pour servir la version compilée et `npm run lint` pour l’analyse ESLint.

## 8. Limites du rôle du frontend

Le frontend affiche les écrans, recueille les saisies, effectue des validations utiles à l’interface et appelle l’API. Les règles d’accès, la persistance des données, les permissions définitives et les traitements métier doivent être validés côté backend. Masquer un bouton dans l’interface ne remplace donc pas une vérification d’autorisation sur le serveur.

## 9. État du dépôt lors de la rédaction

Le dépôt consulté est sur la branche `feature/frontend`. Au moment de la rédaction, quatre fichiers de code avaient des modifications locales non commités concernant le rafraîchissement après invitation, les actions sur son propre compte dans l’équipe et la validation des dates de projet. Ce guide décrit le fonctionnement observé dans le code ; il ne constitue pas un audit exhaustif de toutes les fonctions.
