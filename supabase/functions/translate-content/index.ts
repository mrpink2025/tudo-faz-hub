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

async function translateViaMyMemory(text: string, sourceLang: string, targetLang: string) {
  // MyMemory supports 'auto' detection with 'auto' or ''
  const sl = sourceLang || 'auto'
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(sl)}|${encodeURIComponent(targetLang)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)
  const json = await res.json()
  const translated = json?.responseData?.translatedText as string | undefined
  const detected = (json?.responseData?.detectedLanguage as string | undefined) || sl || 'auto'
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
    // Generate cache key
    const cacheKey = `${text}|${sourceLang}|${targetLang}|${domain}`
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
    const { translatedText: rawTranslated, detectedSource } = await translateViaMyMemory(text, sourceLang, targetLang)
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
        source_lang: detectedSource || sourceLang || 'auto',
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
