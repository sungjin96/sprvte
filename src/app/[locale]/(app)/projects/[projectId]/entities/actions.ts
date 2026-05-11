'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db, projects, entities, assets, entityReferences } from '@/lib/db';
import { translateToEnglish } from '@/lib/translate';

// ── Input schema ──────────────────────────────────────────────────────────────

const referenceSchema = z.object({
  type: z.enum(['front', 'side', 'back', 'main', 'style']),
  dataUrl: z.string().startsWith('data:image/'),
});

const createEntitySchema = z.object({
  name: z.string().trim().min(1).max(128),
  category: z.enum(['character', 'map', 'item', 'ui', 'audio', 'effect']),
  mode: z.enum(['standard', 'quality']),
  description: z.string().trim().max(2000).optional().nullable(),
  prompt: z.string().trim().max(4000).optional().nullable(),
  guideData: z.record(z.unknown()).optional().nullable(),
  references: z.array(referenceSchema).max(5),
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;

export type CreateEntityResult =
  | { ok: true; id: string }
  | { ok: false; error: 'unauthorized' | 'invalid' | 'forbidden' | 'storage_failed' | 'failed' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  return { buffer: Buffer.from(base64, 'base64'), mimeType };
}

function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mimeType] ?? 'png';
}

// ── Server action ─────────────────────────────────────────────────────────────

export async function createEntity(
  locale: string,
  projectId: string,
  input: CreateEntityInput,
): Promise<CreateEntityResult> {
  const parsed = createEntitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: 'unauthorized' };

  // Project ownership check — app-level guard (db bypasses RLS)
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, auth.user.id)));
  if (!project) return { ok: false, error: 'forbidden' };

  const { name, category, mode, description, prompt, guideData, references } = parsed.data;

  // Translate prompt if Korean
  const autoPromptEn = prompt ? await translateToEnglish(prompt) : null;

  // ── Upload reference images in parallel ────────────────────────────────────
  type UploadedRef = { storageUrl: string; referenceType: string; mimeType: string };

  let uploadedRefs: UploadedRef[] = [];
  const uploadedPaths: string[] = [];

  if (references.length > 0) {
    const results = await Promise.all(
      references.map(async (ref) => {
        const { buffer, mimeType } = dataUrlToBuffer(ref.dataUrl);
        const ext = mimeToExt(mimeType);
        const timestamp = Date.now();
        // Path must start with userId to satisfy storage RLS policy
        const path = `${auth.user.id}/${projectId}/${ref.type}_${timestamp}.${ext}`;

        const { error } = await supabase.storage
          .from('references')
          .upload(path, buffer, { contentType: mimeType, upsert: false });

        if (error) return { ok: false as const, path, error };
        return { ok: true as const, path, referenceType: ref.type, mimeType };
      }),
    );

    const failed = results.find((r) => !r.ok);
    if (failed) {
      // Clean up any already-uploaded files before returning error
      const successPaths = results.filter((r) => r.ok).map((r) => r.path);
      if (successPaths.length > 0) {
        await supabase.storage.from('references').remove(successPaths);
      }
      return { ok: false, error: 'storage_failed' };
    }

    uploadedRefs = results
      .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
      .map((r) => ({
        storageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/references/${r.path}`,
        referenceType: r.referenceType,
        mimeType: r.mimeType,
      }));
    uploadedPaths.push(...results.map((r) => r.path));
  }

  // ── DB transaction ─────────────────────────────────────────────────────────
  try {
    const entityId = await db.transaction(async (tx) => {
      // 1. Insert entity
      const [newEntity] = await tx
        .insert(entities)
        .values({
          projectId,
          userId: auth.user!.id,
          category: category as typeof entities.$inferInsert['category'],
          name,
          description: description || null,
          mode: mode as typeof entities.$inferInsert['mode'],
          guideData: (guideData ?? {}) as Record<string, unknown>,
          autoPrompt: autoPromptEn,
        })
        .returning({ id: entities.id });

      // 2. Insert reference assets + entity_references
      if (uploadedRefs.length > 0) {
        const insertedAssets = await tx
          .insert(assets)
          .values(
            uploadedRefs.map((ref) => ({
              projectId,
              userId: auth.user!.id,
              entityId: newEntity.id,
              name: `ref_${ref.referenceType}`,
              type: 'reference' as const,
              status: 'completed' as const,
              fileUrl: ref.storageUrl,
            })),
          )
          .returning({ id: assets.id });

        await tx.insert(entityReferences).values(
          insertedAssets.map((asset, i) => ({
            entityId: newEntity.id,
            assetId: asset.id,
            referenceType: uploadedRefs[i].referenceType,
          })),
        );
      }

      return newEntity.id;
    });

    revalidatePath(`/${locale}/projects/${projectId}/entities`);
    return { ok: true, id: entityId };
  } catch (err) {
    console.error('[createEntity] DB transaction failed', err);
    // Storage cleanup on DB failure
    if (uploadedPaths.length > 0) {
      await supabase.storage.from('references').remove(uploadedPaths);
    }
    return { ok: false, error: 'failed' };
  }
}
