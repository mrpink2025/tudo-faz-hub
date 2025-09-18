import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/integrations/supabase/client'

interface TranslateOptions {
  domain?: string
  sourceLang?: string
  enabled?: boolean
  cacheTime?: number
}

interface TranslationResult {
  translatedText: string
  fromCache: boolean
  sourceLang: string
  targetLang: string
}

export function useAutoTranslate(text: string, options: TranslateOptions = {}) {
  const { i18n } = useTranslation()
  const {
    domain = 'general',
    sourceLang = 'pt', // default to Portuguese to avoid 'auto' issues in providers
    enabled = true,
    cacheTime = 1000 * 60 * 60 // 1 hour
  } = options

  const targetLang = i18n.language

  return useQuery<TranslationResult>({
    queryKey: ['translate', text, sourceLang, targetLang, domain],
    queryFn: async (): Promise<TranslationResult> => {
      if (!text || targetLang === 'pt') {
        return { translatedText: text, fromCache: false, sourceLang, targetLang }
      }

      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          text,
          targetLang,
          sourceLang,
          domain
        }
      })

      if (error) {
        console.warn('Translation failed, using original text:', error)
        return { translatedText: text, fromCache: false, sourceLang, targetLang }
      }

      return data as TranslationResult
    },
    enabled: enabled && Boolean(text) && targetLang !== 'pt',
    staleTime: cacheTime,
    gcTime: cacheTime * 24, // Cache for 24 hours (renamed from cacheTime)
    retry: 1,
    retryDelay: 1000
  })
}