import { subscribe } from '@/libs/realtime';

// Cópia estrutural exata de `app/api/games/[gameId]/stream/route.ts` do
// cross-poker (heartbeat 25s, subscribe/cleanup no abort). Canal
// `table:${code}`.
//
// O nome do evento SSE continua sempre `state-changed` (não criamos um nome
// novo por tipo de ação) — é o client (`useTableStream.ts`) quem diferencia
// pelo `type` dentro do JSON serializado no `data:`. Isso permite estender o
// realtime com payload (ex.: dano/cura, ver `libs/realtime.ts`) sem quebrar
// nenhum listener de `state-changed` que só queira refetch.
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const tableCode = code.toUpperCase();
  const channel = `table:${tableCode}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'));

      const unsubscribe = subscribe(channel, (event) => {
        controller.enqueue(encoder.encode(`event: state-changed\ndata: ${JSON.stringify(event)}\n\n`));
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 25000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
