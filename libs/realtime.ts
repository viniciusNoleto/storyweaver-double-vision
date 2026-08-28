import 'server-only';

// Evento publicado num canal. `type: 'state-changed'` (o default) significa
// "algo mudou, refaça o fetch" — sem payload, mesmo comportamento de sempre.
// `type: 'character-action'` carrega um payload (ver
// `app/api/tables/[code]/characters/[id]/actions/route.ts`) para que o client
// consiga diferenciar "aconteceu uma ação de dano/cura específica" (e animar)
// de "algo mudou" (só refetch). Novos tipos de evento no futuro seguem o mesmo
// formato `{ type, data? }`.
export type RealtimeEvent = {
  type: string;
  data?: unknown;
};

type Listener = (event: RealtimeEvent) => void;

const channels = new Map<string, Set<Listener>>();

export function publish(channel: string, event: RealtimeEvent = { type: 'state-changed' }) {
  channels.get(channel)?.forEach((listener) => listener(event));
}

export function subscribe(channel: string, listener: Listener): () => void {
  if (!channels.has(channel)) channels.set(channel, new Set());

  channels.get(channel)!.add(listener);

  return () => {
    channels.get(channel)?.delete(listener);

    if (channels.get(channel)?.size === 0) channels.delete(channel);
  };
}
