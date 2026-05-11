import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

/**
 * SSE: stream composition seed progress.
 *
 * Phase A (UI mock): emits a deterministic 4-stage progress sequence over ~7s.
 * Phase B: subscribes to Redis pub/sub channel `composition:{id}` published by
 * the BullMQ worker (see src/workers/composition-seed.ts).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stages: { stage: string; progress: number; delayMs: number }[] = [
    { stage: 'generating',  progress: 10,  delayMs: 200 },
    { stage: 'generating',  progress: 35,  delayMs: 1500 },
    { stage: 'generating',  progress: 60,  delayMs: 2200 },
    { stage: 'splitting',   progress: 75,  delayMs: 1300 },
    { stage: 'splitting',   progress: 90,  delayMs: 800 },
    { stage: 'persisting',  progress: 98,  delayMs: 500 },
    { stage: 'completed',   progress: 100, delayMs: 200 },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      send({ compositionId: id, stage: 'queued', progress: 0 });

      for (const s of stages) {
        await new Promise((r) => setTimeout(r, s.delayMs));
        send({ compositionId: id, stage: s.stage, progress: s.progress });
        if (s.stage === 'completed') {
          send({
            compositionId: id,
            stage: 'completed',
            progress: 100,
            // Phase B: include actual layer tree from DB
          });
          break;
        }
      }
      controller.close();
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
