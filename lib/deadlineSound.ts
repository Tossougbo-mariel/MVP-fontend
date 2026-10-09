/** Petit son de notification (deux notes) joué quand une alerte s'affiche.
 *  Synthétisé à la volée avec la Web Audio API : aucun fichier son requis. */
let audioCtx: AudioContext | null = null;

export const playDeadlineAlertSound = (): void => {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;

    if (!audioCtx) audioCtx = new Ctor();
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();

    const start = ctx.currentTime;
    // Deux notes hautes et courtes : "ding-dong" de notification.
    const notes = [880, 1174.66];
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = start + index * 0.16;

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.45);
    });
  } catch {
    // Audio indisponible (ou bloqué avant le premier clic) : le bandeau visuel suffit.
  }
};
