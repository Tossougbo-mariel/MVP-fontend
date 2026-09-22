import Echo from "laravel-echo";
import Pusher from "pusher-js";

let echo: Echo<"pusher"> | null = null;

// Connexion unique au serveur WebSocket Reverb (protocole Pusher).
export function getEcho(token: string): Echo<"pusher"> {
  if (!echo) {
    // laravel-echo doit trouver le client Pusher globalement.
    (globalThis as unknown as { Pusher: unknown }).Pusher = Pusher;

    echo = new Echo({
      broadcaster: "pusher",
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "mvp-websocket-key",
      cluster: "mt1",
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "127.0.0.1",
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      wsPath: "/app",
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