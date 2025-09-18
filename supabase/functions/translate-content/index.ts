import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'
import translate from 'https://esm.sh/@vitalets/google-translate-api@9.2.0'

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { text, targetLang, sourceLang = 'auto', domain = 'general' }: TranslateRequest = await req.json()

    if (!text || !targetLang) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text, targetLang' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
          hits: cached.hits + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('content_hash', hashHex)

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

    // Translate using Google Translate
    const result = await translate(text, { from: sourceLang, to: targetLang })
    
    // Apply glossary terms if any
    let translatedText = result.text
    
    // Apply domain-specific glossary
    const { data: glossaryTerms } = await supabase
      .from('translation_glossary')
      .select('term, translations, case_sensitive')
      .or(`domain.is.null,domain.eq.${domain}`)

    if (glossaryTerms) {
      for (const glossaryTerm of glossaryTerms) {
        const termTranslation = glossaryTerm.translations[targetLang]
        if (termTranslation) {
          const flags = glossaryTerm.case_sensitive ? 'g' : 'gi'
          const regex = new RegExp(glossaryTerm.term, flags)
          translatedText = translatedText.replace(regex, termTranslation)
        }
      }
    }

    // Cache the result
    await supabase
      .from('translations_cache')
      .insert({
        content_hash: hashHex,
        source_text: text,
        source_lang: result.from.language.iso || sourceLang,
        target_lang: targetLang,
        translated_text: translatedText,
        provider: 'google-free',
        domain,
        hits: 1
      })

    // Update metrics
    await supabase
      .from('translation_metrics')
      .upsert({
        date: new Date().toISOString().split('T')[0],
        language: targetLang,
        domain,
        requests_count: 1,
        cache_hits: 0,
        cache_misses: 1,
        total_chars: text.length,
        provider_cost: 0
      }, {
        onConflict: 'date,language,domain',
        count: 'exact'
      })

    return new Response(
      JSON.stringify({
        translatedText,
        fromCache: false,
        sourceLang: result.from.language.iso || sourceLang,
        targetLang
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Translation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Translation failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})