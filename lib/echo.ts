import Echo from "laravel-echo";
import Pusher from "pusher-js";

let echo: Echo<"pusher"> | null = null;

// Connexion unique au serveur WebSocket Reverb (protocole Pusher).
//
// Reverb n'a pas de région, mais pusher-js exige `cluster` et en dérive son
// hôte de repli HTTP : les deux doivent être renseignés, `httpHost` servant à
// garder ce repli sur le serveur local.
export function getEcho(token: string): Echo<"pusher"> {
  if (!echo) {
    // laravel-echo doit trouver le client Pusher globalement.
    (globalThis as unknown as { Pusher: unknown }).Pusher = Pusher;

    echo = new Echo({
      broadcaster: "pusher",
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "mvp-websocket-key",
      // Reclamé par le typage de pusher-js, et Reverb s'en fiche : il n'a pas
      // de région. Il sert surtout à ne pas laisser getHttpHost() construire
      // l'hôte de repli.
      cluster: "mt1",
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "127.0.0.1",
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      // Ne PAS définir wsPath ici : pusher-js préfixe déjà le chemin interne
      // par la valeur de wsPath, il appende ensuite "/app/{key}". Mettre
      // wsPath: "/app" produisait "/app/app/{key}". On garde le défaut vide,
      // et on aligne wssPort sur wsPort pour éviter la retentative TLS sur 443.
      wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      // Indispensable : sans httpHost, pusher-js dérive son hôte de repli HTTP
      // de la seule valeur `cluster`, soit sockjs-mt1.pusher.com. Le frontend
      // partait alors en CORS vers le cloud public de Pusher au lieu de
      // retenter le serveur Reverb local.
      httpHost: `${process.env.NEXT_PUBLIC_REVERB_HOST ?? "127.0.0.1"}:${process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080}`,
      forceTLS: false,
      disableStats: true,
      authEndpoint: `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/api/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }
  return echo;
}

export function disconnectEcho(): void {
  echo?.disconnect();
  echo = null;
}