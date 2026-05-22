import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { locales } from '@/i18n/config'

// --- In-memory rate limiter ---
const RATE_LIMIT_WINDOW_MS = 60_000 // 60 seconds
const RATE_LIMIT_MAX = 30 // max requests per window

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  })
}, RATE_LIMIT_WINDOW_MS)

// --- Input constraints ---
const MAX_TEXTS = 200
const MAX_TEXT_LENGTH = 500
const FETCH_TIMEOUT_MS = 8_000

// Locale whitelist derived from i18n config
const ALLOWED_LOCALES = new Set<string>(locales)

const gLang: Record<string, string> = { 'zh': 'zh-CN' }

export async function POST(request: Request) {
  try {
    // Allow anonymous usage (for registration page)
    // Rate limit using IP address instead of user id
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'

    // --- Rate limiting ---
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'X-Content-Type-Options': 'nosniff' },
        }
      )
    }

    // --- Parse & validate body ---
    const { texts, locale } = await request.json()
    if (!texts || !locale || !Array.isArray(texts)) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    // Locale whitelist
    if (!ALLOWED_LOCALES.has(locale)) {
      return NextResponse.json(
        { error: 'Unsupported locale' },
        { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    // Input size limits
    if (texts.length > MAX_TEXTS) {
      return NextResponse.json(
        { error: `Too many texts. Maximum ${MAX_TEXTS} items allowed.` },
        { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    for (const t of texts) {
      if (typeof t !== 'string' || t.length > MAX_TEXT_LENGTH) {
        return NextResponse.json(
          { error: `Each text must be a string of at most ${MAX_TEXT_LENGTH} characters.` },
          { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
        )
      }
    }

    // Short-circuit: nothing to translate
    if (locale === 'en' || texts.length === 0) {
      return NextResponse.json(texts, {
        headers: { 'X-Content-Type-Options': 'nosniff' },
      })
    }

    const tl = gLang[locale] || locale

    const chunkSize = 50 // Safe chunk size to avoid payload length limits and keep translation accurate
    const translatedArray: string[] = []

    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize)

      // Use " ||| " as a robust non-translatable separator
      const combined = chunk.join(' ||| ')
      // Use GET request to Google Translate with client=at which is less rate‑limited
      const url = `https://translate.google.com/translate_a/single?client=at\u0026sl=en\u0026tl=${tl}\u0026dt=t\u0026q=${encodeURIComponent(combined)}`

      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Google Translate API Error ${res.status}: ${text.substring(0, 100)}`)
      }

      const data = await res.json()
      let translated = ''
      for (let j = 0; j < data[0].length; j++) {
        if (data[0][j][0]) translated += data[0][j][0]
      }

      // Split with robust regex to support arbitrary spaces inserted by Google Translate around the separator
      const arr = translated.split(/\s*\|\|\|\s*/).map(t => t.trim())

      chunk.forEach((_, idx) => {
        translatedArray.push(arr[idx] || chunk[idx])
      })
    }

    return NextResponse.json(translatedArray, {
      headers: { 'X-Content-Type-Options': 'nosniff' },
    })
  } catch (err: unknown) {
    console.error('Translation API error:', err)
    // Never leak internal error details to the client in prod, but for debugging now:
    return NextResponse.json(
      { error: 'Internal server error', details: (err as Error).message, stack: (err as Error).stack },
      { status: 500, headers: { 'X-Content-Type-Options': 'nosniff' } }
    )
  }
}
