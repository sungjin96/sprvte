import { NextRequest, NextResponse } from 'next/server';
import { pixelateImage, type DitherKind, type QuantizerKind, type PixelateProvider } from '@/lib/image/pixelate';

export const runtime = 'nodejs'; // sharp requires native modules
export const maxDuration = 30;

const ALLOWED_SIZES = [8, 16, 32, 64, 128, 256, 512];
const ALLOWED_QUANTIZERS: QuantizerKind[] = ['wuquant', 'rgbquant', 'neuquant'];
const ALLOWED_DITHERS: DitherKind[] = ['none', 'floyd-steinberg', 'atkinson', 'stucki', 'sierra', 'bayer'];
const ALLOWED_PROVIDERS: PixelateProvider[] = ['local', 'replicate'];
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10MB

interface PixelateBody {
  url?: string;
  size?: number;
  paletteSize?: number;
  maxSaturation?: number;
  quantizer?: QuantizerKind;
  dithering?: DitherKind;
  bilateral?: boolean;
  provider?: PixelateProvider;
}

interface ParsedRequest {
  input: Buffer;
  size: number;
  paletteSize?: number;
  maxSaturation?: number;
  quantizer?: QuantizerKind;
  dithering?: DitherKind;
  bilateral?: boolean;
  provider?: PixelateProvider;
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseRequest(req);
    if (parsed instanceof NextResponse) return parsed;

    const { buffer, width, height } = await pixelateImage(parsed.input, {
      targetSize: parsed.size,
      paletteSize: parsed.paletteSize,
      maxSaturation: parsed.maxSaturation,
      quantizer: parsed.quantizer,
      dithering: parsed.dithering,
      bilateral: parsed.bilateral,
      provider: parsed.provider,
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(buffer.byteLength),
        'X-Pixel-Size': String(parsed.size),
        'X-Palette-Size': String(parsed.paletteSize ?? 32),
        'X-Output-Width': String(width),
        'X-Output-Height': String(height),
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err) {
    console.error('[api/pixelate] error:', err);
    const message = err instanceof Error ? err.message : 'internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function parseRequest(req: NextRequest): Promise<ParsedRequest | NextResponse> {
  const contentType = req.headers.get('content-type') ?? '';

  let input: Buffer;
  let body: PixelateBody;

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    if (file.size > MAX_INPUT_BYTES) {
      return NextResponse.json({ error: 'file too large (max 10MB)' }, { status: 413 });
    }
    input = Buffer.from(await file.arrayBuffer());
    body = {
      size: numField(form, 'size'),
      paletteSize: numField(form, 'paletteSize'),
      maxSaturation: numField(form, 'maxSaturation'),
      quantizer: strField(form, 'quantizer') as QuantizerKind | undefined,
      dithering: strField(form, 'dithering') as DitherKind | undefined,
      bilateral: boolField(form, 'bilateral'),
      provider: strField(form, 'provider') as PixelateProvider | undefined,
    };
  } else {
    const json = (await req.json()) as PixelateBody;
    if (!json.url || typeof json.url !== 'string') {
      return NextResponse.json({ error: 'url required' }, { status: 400 });
    }
    const fetchRes = await fetch(json.url);
    if (!fetchRes.ok) {
      return NextResponse.json({ error: `upstream fetch failed (${fetchRes.status})` }, { status: 502 });
    }
    const len = Number(fetchRes.headers.get('content-length') ?? 0);
    if (len && len > MAX_INPUT_BYTES) {
      return NextResponse.json({ error: 'remote file too large' }, { status: 413 });
    }
    input = Buffer.from(await fetchRes.arrayBuffer());
    body = json;
  }

  const size = body.size;
  if (typeof size !== 'number' || !ALLOWED_SIZES.includes(size)) {
    return NextResponse.json(
      { error: `size must be one of ${ALLOWED_SIZES.join(', ')}` },
      { status: 400 },
    );
  }
  if (body.quantizer && !ALLOWED_QUANTIZERS.includes(body.quantizer)) {
    return NextResponse.json({ error: `quantizer must be one of ${ALLOWED_QUANTIZERS.join(', ')}` }, { status: 400 });
  }
  if (body.dithering && !ALLOWED_DITHERS.includes(body.dithering)) {
    return NextResponse.json({ error: `dithering must be one of ${ALLOWED_DITHERS.join(', ')}` }, { status: 400 });
  }
  if (body.provider && !ALLOWED_PROVIDERS.includes(body.provider)) {
    return NextResponse.json({ error: `provider must be one of ${ALLOWED_PROVIDERS.join(', ')}` }, { status: 400 });
  }
  if (body.paletteSize !== undefined && (body.paletteSize < 2 || body.paletteSize > 256)) {
    return NextResponse.json({ error: 'paletteSize out of range' }, { status: 400 });
  }
  if (body.maxSaturation !== undefined && (body.maxSaturation < 0 || body.maxSaturation > 1)) {
    return NextResponse.json({ error: 'maxSaturation out of range (0..1)' }, { status: 400 });
  }

  return {
    input,
    size,
    paletteSize: body.paletteSize,
    maxSaturation: body.maxSaturation,
    quantizer: body.quantizer,
    dithering: body.dithering,
    bilateral: body.bilateral,
    provider: body.provider,
  };
}

function numField(form: FormData, key: string): number | undefined {
  const v = form.get(key);
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function strField(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === 'string' ? v : undefined;
}
function boolField(form: FormData, key: string): boolean | undefined {
  const v = form.get(key);
  if (v === null) return undefined;
  return v === 'true' || v === '1';
}
