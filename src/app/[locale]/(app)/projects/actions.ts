'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db, projects } from '@/lib/db';
import { translateToEnglish } from '@/lib/translate';

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(128),
  genre: z.string().trim().max(64).optional().nullable(),
  artStyle: z.string().trim().max(64).optional().nullable(),
  basePrompt: z.string().trim().max(4000).optional().nullable(),
  colorPalette: z.array(z.string().regex(/^#[0-9a-fA-F]{3,8}$/)).max(16).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export type CreateProjectResult =
  | { ok: true; id: string }
  | { ok: false; error: 'unauthorized' | 'invalid' | 'failed' };

export async function createProject(
  locale: string,
  input: CreateProjectInput,
): Promise<CreateProjectResult> {
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  // RLS-aware client 으로 로그인 유저 확인. middleware 이 가드를 하긴 하지만
  // server action 은 fetch 처럼 직접 호출될 수 있어서 한 번 더 확인.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: 'unauthorized' };

  // Drizzle 로 insert — user_id 를 명시 주입해서 다른 유저 행 생성 불가.
  // RLS 정책도 user_id = auth.uid() 강제하지만 db 클라이언트는 RLS 우회하므로
  // 애플리케이션 레벨에서 user_id 를 신뢰할 수 있는 값(auth.user.id)으로 고정.
  try {
    const rawPrompt = parsed.data.basePrompt || null;
    const basePromptEn = rawPrompt ? await translateToEnglish(rawPrompt) : null;

    const [row] = await db
      .insert(projects)
      .values({
        userId: auth.user.id,
        name: parsed.data.name,
        genre: parsed.data.genre || null,
        artStyle: parsed.data.artStyle || null,
        basePrompt: rawPrompt,
        basePromptEn,
        colorPalette: parsed.data.colorPalette ?? [],
      })
      .returning({ id: projects.id });

    revalidatePath(`/${locale}/projects`);
    return { ok: true, id: row.id };
  } catch (err) {
    console.error('[createProject] insert failed', err);
    return { ok: false, error: 'failed' };
  }
}

export async function createProjectAndGo(locale: string, input: CreateProjectInput) {
  const result = await createProject(locale, input);
  if (result.ok) {
    redirect(`/${locale}/projects/${result.id}/entities`);
  }
  return result;
}
