import { NextRequest, NextResponse } from 'next/server';
import { compositionQueue } from '@/lib/queue';
import { LAYER_TEMPLATES, templateLeafPrompts } from '@/lib/layers/templates';
import type { EntityCategory } from '@/types/entity';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface SeedRequest {
  entityId: string;
  entityCategory: EntityCategory;
  prompt: string;
  modelId: string;
  outputSize: 'regular' | number; // 'regular' or 8..512
}

/**
 * POST /api/compositions/seed
 *
 * Queues the seed pipeline:
 *   - generate base image (ImageProvider)
 *   - Grounded-SAM2 segment per template prompt
 *   - cut layers + thumbs
 *   - persist live_layers tree (DB transaction)
 *
 * Returns { compositionId, jobId } immediately. Client subscribes to
 * /api/compositions/[id]/events for progress.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SeedRequest>;

    // Validate
    if (!body.entityId || typeof body.entityId !== 'string') {
      return NextResponse.json({ error: 'entityId required' }, { status: 400 });
    }
    if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.length > 2000) {
      return NextResponse.json({ error: 'prompt required (max 2000 chars)' }, { status: 400 });
    }
    if (!body.modelId || typeof body.modelId !== 'string') {
      return NextResponse.json({ error: 'modelId required' }, { status: 400 });
    }
    const validCats: EntityCategory[] = ['character', 'map', 'item', 'ui', 'effect'];
    if (!body.entityCategory || !validCats.includes(body.entityCategory)) {
      return NextResponse.json({ error: 'invalid entityCategory' }, { status: 400 });
    }

    const template = LAYER_TEMPLATES[body.entityCategory];
    const samPrompts = templateLeafPrompts(template);

    // TODO Phase B: insert composition row, deduct credits atomically
    const compositionId = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const job = await compositionQueue.add('seed', {
      compositionId,
      entityId: body.entityId,
      prompt: body.prompt,
      modelId: body.modelId,
      outputSize: body.outputSize ?? 'regular',
      template: {
        version: template.version,
        category: template.category,
        prompts: samPrompts,
      },
    });

    return NextResponse.json({
      compositionId,
      jobId: job.id,
      template: { category: template.category, leafCount: samPrompts.length },
    });
  } catch (err) {
    console.error('[api/compositions/seed]', err);
    const msg = err instanceof Error ? err.message : 'internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
