import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranslateRequest {
  text: string
  targetLang: string
  sourceLang?: string
  domain?: string
}

// Language normalization helpers for provider compatibility
function toRFC3066(code: string): string {
  const c = code.trim()
  if (!c.includes('-')) return c
  const [lang, region] = c.split('-')
  return `${lang.toLowerCase()}${region ? '-' + region.toUpperCase() : ''}`
}

function normalizeForProvider(code: string, forSource = false): string {
  if (!code) return forSource ? 'pt' : 'en'
  let c = code.trim().toLowerCase()

  // Map legacy/short forms
  if (c === 'auto') return forSource ? 'pt' : 'en'
  if (c === 'jp') c = 'ja'
  if (c === 'iw') c = 'he'

  // Region handling
  if (c.startsWith('pt')) c = c.includes('-br') ? 'pt-BR' : 'pt'
  else if (c.startsWith('zh')) c = 'zh-CN'
  else if (c.startsWith('en')) c = 'en'
  else if (c.startsWith('es')) c = 'es'
  else if (c.startsWith('fr')) c = 'fr'
  else if (c.startsWith('de')) c = 'de'
  else if (c.startsWith('it')) c = 'it'

  return toRFC3066(c)
}

async function translateViaMyMemory(text: string, sourceLang: string, targetLang: string) {
  // Ensure provider-compatible language codes (MyMemory rejects 'auto')
  const sl = normalizeForProvider(sourceLang, true)
  const tl = normalizeForProvider(targetLang, false)

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(sl)}|${encodeURIComponent(tl)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)
  const json = await res.json()
  const translated = json?.responseData?.translatedText as string | undefined
  const detected = (json?.responseData?.detectedLanguage as string | undefined) || sl
  if (!translated) throw new Error('MyMemory returned empty translation')
  return { translatedText: translated, detectedSource: detected }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let payload: TranslateRequest | null = null
  try {
    payload = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { text, targetLang, sourceLang = 'auto', domain = 'general' } = payload || ({} as TranslateRequest)

  if (!text || !targetLang) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: text, targetLang' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Normalize languages and generate cache key
    const providerSourceLang = normalizeForProvider(sourceLang || 'pt', true)
    const providerTargetLang = normalizeForProvider(targetLang, false)
    const cacheSource = sourceLang && sourceLang !== 'auto' ? sourceLang : 'pt'
    const cacheKey = `${text}|${cacheSource}|${targetLang}|${domain}`
    const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cacheKey))
    const hashHex = Array.from(new Uint8Array(contentHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Check cache first
    const { data: cached } = await supabase
      .from('translations_cache')
      .select('translated_text, hits')
      .eq('content_hash', hashHex)
      .single()

    if (cached) {
      // Update hit count
      await supabase
        .from('translations_cache')
        .update({ 
          hits: (cached.hits ?? 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('content_hash', hashHex)

      // Update metrics via RPC (safe, no direct SQL)
      await supabase.rpc('update_translation_metrics', {
        p_language: targetLang,
        p_domain: domain,
        p_was_cache_hit: true,
        p_char_count: text.length,
        p_response_time: 0,
        p_cost: 0
      })

      return new Response(
        JSON.stringify({ 
          translatedText: cached.translated_text,
          fromCache: true,
          sourceLang,
          targetLang 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Translate using MyMemory (stable, no import issues)
    const t0 = performance.now()
    const { translatedText: rawTranslated, detectedSource } = await translateViaMyMemory(text, providerSourceLang, providerTargetLang)
    let translatedText = rawTranslated

    // Apply domain-specific glossary
    const { data: glossaryTerms } = await supabase
      .from('translation_glossary')
      .select('term, translations, case_sensitive')
      .or(`domain.is.null,domain.eq.${domain}`)

    if (glossaryTerms) {
      for (const glossaryTerm of glossaryTerms as Array<any>) {
        const termTranslation = glossaryTerm?.translations?.[targetLang]
        if (termTranslation) {
          const flags = glossaryTerm.case_sensitive ? 'g' : 'gi'
          try {
            const regex = new RegExp(glossaryTerm.term, flags)
            translatedText = translatedText.replace(regex, termTranslation)
          } catch {
            // If term is an invalid regex, fallback to simple replace (case-sensitive)
            translatedText = translatedText.split(glossaryTerm.term).join(termTranslation)
          }
        }
      }
    }

    // Cache the result
    await supabase
      .from('translations_cache')
      .insert({
        content_hash: hashHex,
        source_text: text,
        source_lang: detectedSource || cacheSource,
        target_lang: targetLang,
        translated_text: translatedText,
        provider: 'mymemory',
        domain,
        hits: 1
      })

    const t1 = performance.now()

    // Update metrics via RPC
    await supabase.rpc('update_translation_metrics', {
      p_language: targetLang,
      p_domain: domain,
      p_was_cache_hit: false,
      p_char_count: text.length,
      p_response_time: Math.round(t1 - t0),
      p_cost: 0
    })

    return new Response(
      JSON.stringify({
        translatedText,
        fromCache: false,
        sourceLang: detectedSource || sourceLang || 'auto',
        targetLang
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Translation error:', error)

    // On any failure, return original text to avoid breaking the UI
    return new Response(
      JSON.stringify({ 
        translatedText: text,
        fromCache: false,
        sourceLang: sourceLang || 'auto',
        targetLang: targetLang || 'en'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
