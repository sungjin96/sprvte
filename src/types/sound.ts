export type SoundCategory = 'bgm' | 'sfx' | 'ambient';

export type SoundStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Sound {
  id: string;
  projectId: string;
  category: SoundCategory;
  name: string;
  status: SoundStatus;
  fileUrl?: string | null;
  durationSec?: number | null;
  bpm?: number | null;
  key?: string | null;
  genre?: string | null;
  mood?: string | null;
  loopable?: boolean;
  loopPointSec?: number | null;
  trimStartSec?: number | null;
  trimEndSec?: number | null;
  fadeInSec?: number | null;
  fadeOutSec?: number | null;
  volume?: number; // 0-1
  prompt?: string | null;
  modelUsed?: string | null;
  creditsCost?: number | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export const SOUND_CATEGORIES: SoundCategory[] = ['bgm', 'sfx', 'ambient'];

export interface MultitrackClip {
  id: string;
  soundId: string;
  trackIndex: number;
  startSec: number;
  endSec: number;
  volume: number;
}

export interface MultitrackSession {
  id: string;
  projectId: string;
  name: string;
  durationSec: number;
  clips: MultitrackClip[];
  createdAt: string;
  updatedAt: string;
}
