import { NextResponse } from 'next/server';

const DEFAULT_LIBRE_TRANSLATE_URL = 'https://libretranslate.de/translate';

async function translateWithGoogle(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string | null> {
  try {
    const url = new URL('https://translate.googleapis.com/translate_a/single');
    url.searchParams.set('client', 'gtx');
    url.searchParams.set('sl', sourceLanguage || 'auto');
    url.searchParams.set('tl', targetLanguage);
    url.searchParams.set('dt', 't');
    url.searchParams.set('q', text);

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) return null;

    const body = await response.json();
    const chunks = Array.isArray(body) ? body[0] : null;
    if (!Array.isArray(chunks)) return null;

    const translated = chunks
      .map((chunk) => Array.isArray(chunk) ? chunk[0] : '')
      .filter((part): part is string => typeof part === 'string' && part.length > 0)
      .join('');

    return translated || null;
  } catch {
    return null;
  }
}

async function translateWithLibreTranslate(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string | null> {
  const endpoint = process.env.TRANSLATE_API_URL || DEFAULT_LIBRE_TRANSLATE_URL;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLanguage || 'auto',
        target: targetLanguage,
        format: 'text',
      }),
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const body = await response.json();
    const translated = typeof body?.translatedText === 'string' ? body.translatedText : null;
    return translated;
  } catch {
    return null;
  }
}

async function translateWithMyMemory(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string | null> {
  try {
    const langpair = `${sourceLanguage || 'en'}|${targetLanguage}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    const body = await response.json();
    const translated = body?.responseData?.translatedText;
    return typeof translated === 'string' ? translated : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const sourceLanguage = typeof body?.sourceLanguage === 'string' ? body.sourceLanguage.trim() : 'auto';
    const targetLanguage = typeof body?.targetLanguage === 'string' ? body.targetLanguage.trim() : 'en';

    if (!text) {
      return NextResponse.json({ translatedText: '' });
    }

    if (text.length > 3000) {
      return NextResponse.json({ translatedText: text.slice(0, 3000) });
    }

    if (!targetLanguage || sourceLanguage === targetLanguage) {
      return NextResponse.json({ translatedText: text });
    }

    const google = await translateWithGoogle(text, sourceLanguage, targetLanguage);
    if (google) {
      return NextResponse.json({ translatedText: google, provider: 'google' });
    }

    const libre = await translateWithLibreTranslate(text, sourceLanguage, targetLanguage);
    if (libre) {
      return NextResponse.json({ translatedText: libre, provider: 'libretranslate' });
    }

    const myMemory = await translateWithMyMemory(text, sourceLanguage, targetLanguage);
    if (myMemory) {
      return NextResponse.json({ translatedText: myMemory, provider: 'mymemory' });
    }

    return NextResponse.json({ translatedText: text, provider: 'fallback' });
  } catch {
    return NextResponse.json({ translatedText: '' }, { status: 500 });
  }
}
