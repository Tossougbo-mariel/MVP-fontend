export type Wallpaper = {
  id: string;
  label: string;
  src: string;
  thumb: string;
};

export const WALLPAPERS: Wallpaper[] = [
  { id: "foret", label: "Forêt", src: "https://picsum.photos/id/10/1920/1080", thumb: "https://picsum.photos/id/10/400/225" },
  { id: "ocean", label: "Océan", src: "https://picsum.photos/id/18/1920/1080", thumb: "https://picsum.photos/id/18/400/225" },
  { id: "montagne", label: "Montagne", src: "https://picsum.photos/id/29/1920/1080", thumb: "https://picsum.photos/id/29/400/225" },
  { id: "lac", label: "Lac", src: "https://picsum.photos/id/49/1920/1080", thumb: "https://picsum.photos/id/49/400/225" },
  { id: "architecture", label: "Architecture", src: "https://picsum.photos/id/36/1920/1080", thumb: "https://picsum.photos/id/36/400/225" },
  { id: "collines", label: "Collines", src: "https://picsum.photos/id/42/1920/1080", thumb: "https://picsum.photos/id/42/400/225" },
  { id: "roche", label: "Roche", src: "https://picsum.photos/id/74/1920/1080", thumb: "https://picsum.photos/id/74/400/225" },
  { id: "cascade", label: "Nature", src: "https://picsum.photos/id/83/1920/1080", thumb: "https://picsum.photos/id/83/400/225" },
];

export const getWallpaperById = (id: string | null | undefined): Wallpaper | undefined =>
  WALLPAPERS.find((w) => w.id === id);

export const getWallpaperBg = (id: string | null | undefined): string | null =>
  getWallpaperById(id)?.src ?? null;