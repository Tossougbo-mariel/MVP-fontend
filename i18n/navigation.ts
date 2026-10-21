import { createNavigation } from "next-intl/navigation";
import type { ComponentProps, FC } from "react";
import { routing } from "./routing";

const navigation = createNavigation(routing);

export type Locale = (typeof routing.locales)[number];

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly (string | number | boolean)[];

export type QueryParams = Record<string, QueryValue>;

/**
 * Cible d'un lien : chemin interne (`/mes-agences`) ou objet
 * `{ pathname, query, params }`.
 */
export type Href =
  | string
  | {
      pathname: string;
      query?: QueryParams;
      params?: Record<string, string | string[]>;
    };

/**
 * `routing.pathnames` ne déclare que les routes publiques (`/connexion`,
 * `/inscription`…). Le typage d'origine de next-intl rejetait donc tous les
 * liens internes (~90 erreurs TS) alors que le runtime les gère correctement :
 * un pathname inconnu est conservé tel quel et reçoit simplement le préfixe
 * de locale (`/fr/mes-agences`, `/en/mes-agences`).
 *
 * On élargit donc uniquement les types, sans toucher au comportement : les URLs
 * localisées des routes publiques restent générées par next-intl
 * (`/en/login`, `/en/sign-up`…).
 */
type LinkProps = ComponentProps<typeof navigation.Link>;

export const Link = navigation.Link as unknown as FC<
  Omit<LinkProps, "href"> & { href: Href }
>;

export const usePathname = navigation.usePathname as unknown as () => string;

export const useRouter = navigation.useRouter as unknown as () => {
  push: (href: Href, options?: { locale?: Locale }) => void;
  replace: (href: Href, options?: { locale?: Locale }) => void;
  prefetch: (href: Href, options?: { locale?: Locale }) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
};

export type PathnameArgs = {
  href: Href;
  locale: Locale;
  forcePrefix?: boolean;
};

export const getPathname = navigation.getPathname as unknown as (
  args: PathnameArgs
) => string;

export const redirect = navigation.redirect as unknown as (
  args: PathnameArgs,
  type?: Parameters<typeof navigation.redirect>[1]
) => never;

export const permanentRedirect = navigation.permanentRedirect as unknown as (
  args: PathnameArgs,
  type?: Parameters<typeof navigation.permanentRedirect>[1]
) => never;
