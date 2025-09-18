import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/integrations/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { splitTextSafely } from '@/utils/textSplitter'

interface ChunkedTranslatedTextProps {
  text: string
  domain?: string
  sourceLang?: string
  className?: string
  as?: keyof JSX.IntrinsicElements
  loadingSkeleton?: boolean
  maxChunkSize?: number
}

interface ChunkState {
  original: string
  translated: string | null
  loading: boolean
  error: boolean
}

export function ChunkedTranslatedText({ 
  text, 
  domain = 'general',
  sourceLang = 'pt',
  className = '',
  as: Component = 'div',
  loadingSkeleton = true,
  maxChunkSize = 450
}: ChunkedTranslatedTextProps) {
  const { i18n } = useTranslation()
  const targetLang = i18n.language
  const [chunks, setChunks] = useState<ChunkState[]>([])
  const [allTranslated, setAllTranslated] = useState(false)

  // Initialize chunks when text changes
  useEffect(() => {
    if (!text || targetLang === 'pt') {
      setChunks([{ original: text, translated: text, loading: false, error: false }])
      setAllTranslated(true)
      return
    }

    const textChunks = splitTextSafely(text, maxChunkSize)
    const initialChunks = textChunks.map(chunk => ({
      original: chunk,
      translated: null,
      loading: true,
      error: false
    }))
    
    setChunks(initialChunks)
    setAllTranslated(false)
    
    console.log(`[ChunkedTranslatedText] Split text into ${textChunks.length} chunks:`, 
      textChunks.map((chunk, i) => `Chunk ${i + 1}: ${chunk.length} chars`).join(', '))
  }, [text, targetLang, maxChunkSize])

  // Translate chunks sequentially with delays
  useEffect(() => {
    if (targetLang === 'pt' || chunks.length === 0) return

    const translateChunks = async () => {
      const updatedChunks = [...chunks]
      let hasErrors = false

      for (let i = 0; i < updatedChunks.length; i++) {
        if (updatedChunks[i].translated) continue // Skip already translated

        try {
          console.log(`[ChunkedTranslatedText] Translating chunk ${i + 1}/${updatedChunks.length}`)
          
          const { data, error } = await supabase.functions.invoke('translate-content', {
            body: {
              text: updatedChunks[i].original,
              targetLang,
              sourceLang,
              domain
            }
          })

          if (error) {
            console.warn(`[ChunkedTranslatedText] Translation failed for chunk ${i + 1}:`, error)
            updatedChunks[i] = {
              ...updatedChunks[i],
              translated: updatedChunks[i].original, // Fallback to original
              loading: false,
              error: true
            }
            hasErrors = true
          } else {
            updatedChunks[i] = {
              ...updatedChunks[i],
              translated: data.translatedText,
              loading: false,
              error: false
            }
            console.log(`[ChunkedTranslatedText] Chunk ${i + 1} translated successfully`)
          }

          // Update state after each chunk
          setChunks([...updatedChunks])

          // Add delay between requests to avoid rate limiting
          if (i < updatedChunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800))
          }
        } catch (error) {
          console.error(`[ChunkedTranslatedText] Error translating chunk ${i + 1}:`, error)
          updatedChunks[i] = {
            ...updatedChunks[i],
            translated: updatedChunks[i].original, // Fallback to original
            loading: false,
            error: true
          }
          hasErrors = true
          setChunks([...updatedChunks])
        }
      }

      setAllTranslated(true)
      if (hasErrors) {
        console.warn('[ChunkedTranslatedText] Some chunks failed to translate, using original text')
      }
    }

    translateChunks()
  }, [chunks.length, targetLang, sourceLang, domain])

  // Show loading skeleton while translating
  if (chunks.some(chunk => chunk.loading) && loadingSkeleton) {
    return (
      <div className={className}>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  // Reconstruct the translated text, preserving structure
  const translatedText = chunks
    .map(chunk => chunk.translated || chunk.original)
    .join('\n\n') // Rejoin with paragraph breaks

  return (
    <Component className={className}>
      {translatedText}
    </Component>
  )
}