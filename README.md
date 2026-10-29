# MVP STUDIO — Frontend

Application web de gestion d’agences, d’équipes, de projets et de tâches. Le frontend est développé avec Next.js, React et TypeScript. Il communique avec le backend REST Laravel, lancé séparément.

Ce guide explique, sous Windows, comment cloner le dépôt, installer les dépendances dans l’ordre, configurer l’API et les WebSockets, démarrer les services, vérifier l’installation et utiliser la plateforme.

## Stack technique

- **Framework web** : Next.js 16.3.4 (App Router, Turbopack)
- **Interface** : React 19.2.8, TypeScript 5
- **Styles** : Tailwind CSS 4 et feuilles CSS de l’application
- **Langues et routes localisées** : `next-intl` (français et anglais)
- **API** : Axios ; le backend est une API Laravel séparée
- **État client** : Zustand et contextes React
- **Temps réel** : Laravel Echo, Pusher JS et Laravel Reverb
- **Formulaires et validation** : React Hook Form et Zod
- **Assistant IA** : interface web en lecture seule ; la clé et le fournisseur sont configurés exclusivement dans le backend

> L’installation et les variables du backend sont documentées dans le README de `gestion-des-taches-back`. Le frontend ne contient pas de base de données et ne doit pas recevoir les secrets privés du backend.

## Prérequis

Le tableau suppose que les outils sont déjà installés. Lance les commandes de vérification dans un terminal PowerShell. Next.js 16 demande Node.js 20.9 ou plus récent. [Prérequis officiels Next.js](https://nextjs.org/docs/app/getting-started/installation#system-requirements)

| Ordre | Outil | Obligatoire | Vérification | Si absent |
|---|---|---:|---|---|
| — | Windows 10/11 64 bits | Oui | `[Environment]::Is64BitOperatingSystem` (doit afficher `True`) | — |
| 1 | Git | Oui pour cloner le dépôt | `git --version` | <https://git-scm.com/download/win> |
| 2 | Node.js 20.9+ | Oui | `node -v` | <https://nodejs.org> |
| 3 | npm | Oui, fourni avec Node.js | `npm -v` | Réinstaller Node.js si npm manque |
| — | Backend Laravel en local | Oui pour se connecter et charger les données | `Invoke-WebRequest http://localhost:8000/up` | Suivre le README du backend |
| — | Reverb | Facultatif pour les fonctions temps réel | `Test-NetConnection 127.0.0.1 -Port 8081` | Voir le README du backend |
| — | Éditeur de code | Facultatif | — | Au choix |

### Ports locaux utilisés

| Service | Port par défaut | Requis |
|---|---:|---|
| Frontend Next.js | `3000` | Oui |
| API Laravel | `8000` | Oui pour les données et l’authentification |
| Laravel Reverb | `8081` | Facultatif pour les notifications et événements temps réel |

Si un port est déjà pris, arrête l’ancien serveur ou configure le service concerné avant le démarrage. Next.js peut proposer automatiquement un autre port, par exemple `3001` ; dans ce cas, utilise l’adresse affichée dans le terminal et vérifie que le backend autorise cette origine si l’API est appelée directement.

---

## Installation — étapes dans l’ordre

Les commandes ci-dessous utilisent le dépôt de l’entreprise. Il est privé : ton compte GitHub doit avoir accès au dépôt.

### 1. Vérifier les outils

```powershell
git --version
node -v
npm -v
```

Vérifie que `node -v` affiche `v20.9.0` ou une version supérieure.

### 2. Cloner le dépôt frontend

Place-toi dans le dossier où tu conserves tes projets, puis clone le dépôt :

```powershell
Set-Location C:\Users\HomePC\Music
git clone https://github.com/10-20TECHNOLOGIES-SARL/gestion-des-taches-front.git MVP-fontend
Set-Location .\MVP-fontend
```

Si le dépôt est déjà cloné, ouvre un terminal à sa racine (le dossier contenant `package.json`) et vérifie le chemin :

```powershell
Get-Location
```

### 3. Installer les dépendances JavaScript

À la racine du frontend :

```powershell
npm ci
```

`npm ci` installe les versions enregistrées dans `package-lock.json`. C’est la commande à utiliser après un nouveau clone. Il n’est pas nécessaire d’installer les dépendances une par une.

### 4. Configurer `.env.local`

Le frontend fonctionne avec les valeurs par défaut lorsque Laravel est sur `http://localhost:8000`. Pour utiliser un autre serveur, crée `.env.local` à la racine du frontend :

```powershell
notepad .env.local
```

Copie le [modèle de configuration](#modèle-local-envlocal) ci-dessous et adapte les valeurs si nécessaire. Enregistre le fichier puis redémarre `npm run dev` après tout changement.

### 5. Démarrer le backend

Ouvre un autre terminal dans le dossier du backend et suis son README pour préparer PostgreSQL, les migrations, `.env` et les données. Pour lancer une installation backend déjà configurée, l’API doit répondre à :

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

L’API locale doit donc être accessible sur `http://localhost:8000`. La commande `/up` sert à vérifier l’état du backend :

```powershell
Invoke-WebRequest http://localhost:8000/up
```

### 6. Démarrer les services backend optionnels

Ces processus se lancent depuis le dossier backend, dans des terminaux séparés :

**Reverb — événements WebSocket temps réel**

```powershell
php artisan reverb:start --host=127.0.0.1 --port=8081
```

**Scheduler — rappels et vérifications d’échéance**

```powershell
php artisan schedule:work
```

Un worker de queue n’est nécessaire que si le backend utilise une connexion de queue asynchrone. Consulte son `.env` et son README ; avec `QUEUE_CONNECTION=sync`, aucun worker n’est requis.

### 7. Démarrer le frontend

Dans un terminal à la racine du frontend :

```powershell
npm run dev
```

Laisse ce terminal ouvert pendant que tu utilises l’application. Ouvre ensuite [http://localhost:3000/fr/accueil](http://localhost:3000/fr/accueil).

### 8. Vérifier les services

Dans PowerShell :

```powershell
(Invoke-WebRequest http://localhost:3000/fr/accueil -UseBasicParsing).StatusCode
(Invoke-WebRequest http://localhost:8000/up -UseBasicParsing).StatusCode
Test-NetConnection 127.0.0.1 -Port 8081
```

Les deux premières commandes doivent afficher `200`. Le test du port `8081` ne réussit que si Reverb est lancé ; il est facultatif pour le simple affichage des pages.

---

## Configuration détaillée de `.env.local`

`.env.local` est propre à la machine et ne doit jamais être ajouté au dépôt. Les variables `NEXT_PUBLIC_*` sont incorporées ou exposées dans le navigateur : elles ne doivent contenir aucun secret privé.

| Variable | Valeur locale par défaut | Statut | Utilisation |
|---|---|---|---|
| `BACKEND_API_URL` | `http://localhost:8000` | Optionnelle pour la valeur par défaut ; obligatoire si le backend est ailleurs | Destination serveur des réécritures Next.js `/api/*` et de `/auth/google/redirect`. Indiquer l’origine du backend sans `/api`. |
| `NEXT_PUBLIC_API_URL` | Non définie (le frontend utilise `/api`) | Facultative | Si elle est définie, l’API est appelée directement depuis le navigateur. Exemple : `http://localhost:8000/api`. Le backend doit autoriser l’origine du frontend dans CORS. |
| `NEXT_PUBLIC_BACKEND_URL` | Non définie | Facultative | Origine du backend utilisée pour l’authentification Reverb (`/api/broadcasting/auth`). Ne pas ajouter `/api`. Google utilise `NEXT_PUBLIC_API_URL` si définie ; sinon, la réécriture Next.js relaie la route vers `BACKEND_API_URL`. |
| `NEXT_PUBLIC_REVERB_APP_KEY` | `mvp-websocket-key` | Facultative si Reverb n’est pas utilisé | Clé publique du client Reverb ; doit correspondre à `REVERB_APP_KEY` du backend. Ce n’est pas le secret Reverb. |
| `NEXT_PUBLIC_REVERB_HOST` | `127.0.0.1` | Facultative si Reverb n’est pas utilisé | Hôte WebSocket utilisé par le navigateur. |
| `NEXT_PUBLIC_REVERB_PORT` | `8081` | Facultative si Reverb n’est pas utilisé | Port WebSocket utilisé par le navigateur. |

### Modèle local `.env.local`

```dotenv
# Origine du backend Laravel (sans /api)
BACKEND_API_URL=http://localhost:8000

# Ne définis NEXT_PUBLIC_API_URL que si tu veux contourner le proxy Next.js.
# Si tu le renseignes, le backend doit accepter CORS depuis le frontend.
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Laisse cette variable absente pour utiliser le proxy local par défaut.
# NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Reverb : valeurs locales par défaut du frontend.
NEXT_PUBLIC_REVERB_APP_KEY=mvp-websocket-key
NEXT_PUBLIC_REVERB_HOST=127.0.0.1
NEXT_PUBLIC_REVERB_PORT=8081
```

### Variables configurées côté backend uniquement

Le frontend n’a pas besoin de recevoir `AI_API_KEY`, `GOOGLE_CLIENT_SECRET`, `REVERB_APP_SECRET`, les mots de passe SMTP ou PostgreSQL. Ces valeurs restent dans le `.env` backend. Pour Google OAuth, les identifiants et URI de callback sont aussi configurés côté backend, comme indiqué dans son README.

---

## Utiliser l’application — guide pas à pas

### 1. Créer un compte ou ouvrir une session

1. Depuis **Accueil**, choisis **S’inscrire**.
2. Renseigne ton prénom, ton nom, ton adresse e-mail et ton mot de passe. Confirme le mot de passe ; il doit contenir au moins 8 caractères. La photo de profil est facultative et peut être recadrée.
3. Après la création, ouvre **Connexion** et connecte-toi. Le formulaire peut proposer mot de passe, code envoyé par e-mail ou Google si le backend est configuré pour ces méthodes.
4. Si la double authentification est activée, saisis le code reçu après le mot de passe. Tu peux demander un nouveau code si nécessaire.
5. Si tu as oublié ton mot de passe, demande un lien depuis **Mot de passe oublié ?**, puis ouvre-le pour définir un nouveau mot de passe.

### 2. Créer ou rejoindre une agence

Une agence regroupe les membres, projets et tâches d’un espace de travail.

**Pour créer une agence :** ouvre **Mes agences**, sélectionne **Créer une agence**, saisis son nom et, si tu le souhaites, sa description. Le nom est obligatoire.

**Pour rejoindre une agence :** ouvre le lien d’invitation reçu par e-mail. Crée un compte ou connecte-toi avec l’adresse e-mail invitée, puis accepte l’invitation si l’écran te le demande. L’agence apparaît ensuite dans **Mes agences**. Si le lien a expiré ou a été annulé, demande au propriétaire d’en envoyer un nouveau.

### 3. Comprendre les rôles

| Rôle | Actions générales |
|---|---|
| Propriétaire | Gère l’agence, ses paramètres, l’équipe, les projets et les tâches. Les réglages d’agence sont réservés au propriétaire. |
| Administrateur | Gère les projets, tâches et autres membres selon les règles de l’agence. Il n’accède pas aux paramètres de l’agence et ne peut pas modifier son propre rôle, désactiver son compte ou se retirer lui-même. |
| Membre | Consulte et met à jour les tâches auxquelles il a accès. La possibilité de créer des projets ou d’envoyer des invitations dépend des paramètres définis par le propriétaire. |

Si une action n’est pas disponible, demande au propriétaire de vérifier ton rôle et les paramètres de l’agence. Le serveur vérifie aussi les autorisations ; l’affichage d’un bouton ne remplace pas cette validation.

### 4. Inviter et gérer une équipe

1. Dans l’agence, ouvre **Équipe**.
2. Renseigne l’adresse e-mail à inviter et confirme l’envoi.
3. Suis l’invitation dans **Invitations en attente**. Selon ton rôle, tu peux la relancer ou l’annuler.
4. La liste des membres permet la recherche par nom/e-mail et le filtrage par rôle.
5. Un propriétaire ou administrateur autorisé peut promouvoir un autre membre en administrateur, le rétrograder, désactiver ou réactiver son compte, ou le retirer de l’agence.

Un compte désactivé ne peut notamment plus recevoir de nouvelles tâches. Le retrait d’un membre est distinct de la désactivation ; une confirmation précise l’effet sur ses projets. L’administrateur ne peut pas effectuer ces actions sur son propre compte.

### 5. Créer et suivre un projet

1. Dans une agence, ouvre **Projets**, puis **Nouveau projet**.
2. Saisis le nom et ajoute éventuellement une description.
3. Choisis une date de début qui n’est pas passée, puis une échéance égale ou postérieure à la date de début.
4. Tu peux ajouter des membres de l’agence au projet et choisir un fond de Kanban. Ces champs sont facultatifs.
5. Valide **Créer le projet**. Son statut initial est **À venir** et sa page s’ouvre.

La liste des projets affiche statut, progression et tâches. Depuis une fiche projet, les utilisateurs autorisés peuvent modifier son nom, sa description, ses dates, son statut, son fond et ses membres. Les projets archivés sont restaurables. La suppression définitive efface aussi les tâches, sous-tâches, fichiers et commentaires du projet.

Le tableau de bord de l’agence présente les indicateurs, tâches en retard, activité récente et progression hebdomadaire. L’export de rapport est disponible selon les droits affichés.

### 6. Créer et organiser des tâches

Les tâches se créent depuis le **Kanban** du projet :

1. Ouvre le projet, puis **Kanban** et **Nouvelle tâche**.
2. Saisis un titre (obligatoire) et éventuellement une description.
3. Choisis les dates de début et d’échéance, toutes deux requises. Elles doivent rester dans les limites du projet et l’échéance ne peut pas précéder le début.
4. Choisis éventuellement une priorité — Basse, Moyenne, Haute ou Urgente — et assigne la tâche à un membre du projet.
5. Valide **Créer la tâche**. Elle apparaît dans la colonne de son statut initial.

Les colonnes par défaut sont **À faire**, **En cours**, **En révision** et **Terminée**. Le propriétaire peut les personnaliser depuis les paramètres de l’agence ; au moins un statut doit clôturer une tâche.

Fais glisser une carte vers une autre colonne pour modifier son statut si tu as le droit de le faire. Clique sur la carte pour ouvrir sa fiche. Le Kanban inclut filtres, tâches archivées et sélection multiple pour certaines opérations groupées. **Mes tâches** rassemble les tâches assignées à ton compte.

### 7. Utiliser une fiche de tâche

Selon ton rôle et ton affectation, la fiche permet de consulter ou de modifier le titre, la description, les dates, la priorité et le responsable. Elle contient également :

- l’avancement et l’historique des changements ;
- les étiquettes du projet ;
- les sous-tâches, à ajouter et cocher au fil du travail ;
- les dépendances/prérequis avec d’autres tâches du projet ;
- les pièces jointes à téléverser ou télécharger ;
- les commentaires, avec mention d’un collègue en tapant `@`.

Une tâche dépendante ne peut pas toujours être clôturée tant qu’un prérequis n’est pas terminé. L’application peut aussi demander confirmation si des sous-tâches restent incomplètes. L’archivage retire la tâche du Kanban tout en permettant sa restauration ; la suppression définitive efface également ses sous-tâches, fichiers et commentaires.

### 8. Consulter le planning

Depuis un projet, choisis **Planning**. Bascule entre le calendrier et le diagramme de Gantt. Les tâches sans dates apparaissent dans une liste distincte ; le Gantt peut montrer les dépendances. Le planning est en lecture seule pour les utilisateurs qui ne peuvent pas modifier le projet : ouvre la tâche ou retourne au Kanban pour la modifier.

### 9. Consulter notifications et échéances

La page **Notifications** regroupe les invitations, affectations, changements de rôle ou de compte, commentaires, mentions et événements liés aux échéances. Utilise **Toutes** ou **Non lues**, filtre par catégorie, puis marque les éléments comme lus/non lus ou sélectionne plusieurs notifications pour les supprimer.

**Alertes d’échéance** sépare les tâches en retard de celles dont l’échéance approche. Choisis un filtre et ouvre **Voir la tâche** pour accéder à sa fiche. Une alerte informe ; elle ne modifie pas automatiquement le statut de la tâche.

### 10. Profil et réglages

Dans **Profil**, modifie tes informations personnelles/professionnelles (prénom, nom, téléphone, ville/pays, bio, poste), ta photo et les paramètres de sécurité. Pour activer la double authentification, suis l’écran ; un code e-mail sera demandé après le mot de passe. Pour modifier le mot de passe, indique l’actuel, le nouveau (au moins 8 caractères) et sa confirmation.

Dans **Réglages**, choisis la langue, le thème clair/sombre, la couleur d’accent et tes préférences de notifications. Ces préférences sont personnelles et s’appliquent à tes agences. Les paramètres d’agence — règles d’invitation, création de projet et statuts de tâche — sont réservés au propriétaire.

### 11. Assistant IA

Ouvre **Assistant IA** dans la navigation ou avec le bouton flottant en bas à droite. Tu peux poser une question ou utiliser les suggestions pour savoir par quoi commencer, repérer les tâches en retard ou résumer les projets. Dans une agence, le panneau utilise le contexte de l’agence active.

L’assistant est en lecture seule : il résume et propose, mais ne crée ni ne modifie de données. Il nécessite `AI_API_KEY` côté backend. Sans cette clé, l’interface indique que le service n’est pas configuré et ne simule pas de réponse.

---

## Routes principales

Toutes les pages portent un préfixe de langue : `/fr` ou `/en`. Les chemins sont adaptés à la langue (par exemple `/fr/connexion` et `/en/login`).

| Page | Route française |
|---|---|
| Accueil public | `/fr/accueil` |
| Connexion / inscription | `/fr/connexion` · `/fr/inscription` |
| Récupération / changement du mot de passe | `/fr/mot-de-passe-oublie` · `/fr/modifier-mot-de-passe` |
| Mes agences / créer une agence | `/fr/mes-agences` · `/fr/agences/nouvelle` |
| Tableau de bord d’agence | `/fr/agences/{agencyId}/dashboard` |
| Projets | `/fr/agences/{agencyId}/projets` |
| Kanban d’un projet | `/fr/agences/{agencyId}/projets/{projectId}/kanban` |
| Planning d’un projet | `/fr/agences/{agencyId}/projets/{projectId}/planning` |
| Équipe et paramètres d’agence | `/fr/agences/{agencyId}/equipe` · `/fr/agences/{agencyId}/parametres` |
| Mes tâches / alertes / notifications | `/fr/agences/{agencyId}/mes-taches` · `/fr/alertes` · `/fr/notifications` |
| Profil et réglages personnels | `/fr/profil` · `/fr/reglages` |

Les pages projet et tâche nécessitent une session valide et l’accès correspondant à l’agence/projet.

---

## Scripts et vérifications du frontend

| Commande | Utilité |
|---|---|
| `npm run dev` | Lance le serveur Next.js de développement |
| `npm run lint` | Analyse le code avec ESLint |
| `npm run build` | Compile l’application pour la production |
| `npm run start` | Sert l’application compilée après `npm run build` |

Le `package.json` ne définit pas de script `test`. Avant de livrer une modification, les vérifications disponibles sont :

```powershell
npm run lint
npm run build
```

Pour simuler le mode de production local après le build :

```powershell
npm run start
```

Les variables `NEXT_PUBLIC_*` sont publiques pour le navigateur. Configure-les avant le build de production ; après un changement, relance le serveur de développement ou reconstruis l’application.

---

## Dépendances principales

Les dépendances exactes sont verrouillées par `package-lock.json` et installées avec `npm ci`. Les versions ci-dessous sont celles déclarées dans `package.json`.

| Package | Version déclarée | Rôle |
|---|---|---|
| `next` | `16.3.4` | Framework web |
| `react`, `react-dom` | `19.2.8` | Interface React |
| `next-intl` | `^4.14.9` | Traductions et routes localisées |
| `axios` | `^1.20.0` | Requêtes HTTP vers l’API |
| `zustand` | `^5.0.15` | État client, notamment session |
| `@tanstack/react-query` | `^5.102.8` | Cache et synchronisation de requêtes |
| `react-hook-form`, `zod` | `^7.87.0`, `^3.25.76` | Gestion et validation des formulaires |
| `laravel-echo`, `pusher-js` | `2.5.0`, `8.6.0` | Abonnement aux événements Reverb |
| `framer-motion` | `^13.2.0` | Animations d’interface |
| `tailwindcss` | `^4` | Styles utilitaires |
| `eslint` | `^9` | Analyse statique du code |

---

## Organisation du code

| Chemin | Rôle |
|---|---|
| `app/[locale]/` | Pages et layouts organisés par langue |
| `app/[locale]/(PageConnexion)/` | Inscription, connexion, mots de passe et invitations |
| `app/[locale]/(app)/` | Pages après connexion |
| `app/[locale]/(app)/agences/[agencyId]/` | Dashboard, projets, tâches, équipe et paramètres d’agence |
| `i18n/` | Configuration de routage et chargement des messages |
| `messages/fr.json`, `messages/en.json` | Traductions de l’interface |
| `lib/api.ts` | Client HTTP, ajout du token et gestion des erreurs |
| `lib/auth.ts` | Appels liés à l’authentification |
| `lib/services.ts` | Opérations métier API |
| `lib/appData.tsx` | Chargement, mise en cache et partage des données d’application |
| `lib/echo.ts` | Connexion Laravel Echo/Reverb |
| `app/store/` | État client de session et d’alertes |
| `next.config.ts` | Réécritures API, redirections et configuration Next.js |

---

## Dépannage

| Symptôme | Cause habituelle et action |
|---|---|
| `npm ci` échoue ou Next refuse de démarrer | Vérifie `node -v` (20.9+) et relance l’installation à la racine du dépôt. |
| L’accueil s’ouvre mais les agences restent vides | Vérifie que le backend fonctionne sur l’URL de `BACKEND_API_URL` et que sa base de données est configurée. |
| Erreur 502/503 sur `/api/...` | L’API Laravel est arrêtée ou `BACKEND_API_URL` est incorrect. Vérifie d’abord `http://localhost:8000/up`. |
| Erreur CORS avec `NEXT_PUBLIC_API_URL` | Le navigateur appelle directement Laravel. Ajoute l’origine du frontend à la configuration CORS du backend ou retire cette variable pour utiliser le proxy Next.js. |
| Connexion Google échoue | Vérifie les identifiants Google et l’URI de callback dans le `.env` backend ainsi que `FRONTEND_URL`. |
| WebSocket échoue sur `8081` | Vérifie que `php artisan reverb:start` tourne, que les valeurs de clé/hôte/port correspondent entre frontend et backend, et que le port est libre. Les appels REST peuvent fonctionner sans Reverb. |
| Les rappels d’échéance n’arrivent pas | Le scheduler est exécuté côté backend ; vérifie `php artisan schedule:work` et les préférences de notifications. |
| Assistant IA affiche « Non configuré » ou 503 | Configure `AI_API_KEY` dans le `.env` backend, puis vide le cache de configuration selon son README. N’ajoute pas cette clé au frontend. |
| Une page affiche « Agence introuvable » ou « Accès refusé » | Vérifie le compte connecté, l’invitation acceptée et l’appartenance à l’agence/projet. |
| Un bouton de gestion n’apparaît pas | L’action peut être réservée au propriétaire/admin ou désactivée par les paramètres de l’agence. |

---

## Sécurité et confidentialité

- Le fichier `.env.local` ne doit pas être commité ni envoyé dans une capture d’écran.
- Toute variable préfixée `NEXT_PUBLIC_` peut être lue par les utilisateurs dans le navigateur. N’y mets pas de mot de passe, secret OAuth, secret Reverb ou clé IA.
- Les clés IA, Google OAuth, SMTP et le secret Reverb restent dans le `.env` du backend.
- En production, remplace les adresses `localhost` par les domaines HTTPS réels et ajuste CORS, OAuth et Reverb côté backend.
