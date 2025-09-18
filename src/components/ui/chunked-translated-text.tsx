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

  // Translate chunks with optimized timing
  useEffect(() => {
    if (targetLang === 'pt' || chunks.length === 0) return

    const translateChunks = async () => {
      const updatedChunks = [...chunks]
      let hasErrors = false

      // Process chunks in small batches for faster response
      const batchSize = Math.min(3, chunks.length)
      
      for (let batchStart = 0; batchStart < updatedChunks.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, updatedChunks.length)
        const batchPromises = []

        // Process batch with staggered timing
        for (let i = batchStart; i < batchEnd; i++) {
          if (updatedChunks[i].translated) continue

          const delay = (i - batchStart) * 200 // Stagger by 200ms within batch
          
          const promise = new Promise<void>(async (resolve) => {
            await new Promise(r => setTimeout(r, delay))
            
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
                  translated: updatedChunks[i].original,
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

              // Update state immediately after each chunk
              setChunks([...updatedChunks])
              resolve()
            } catch (error) {
              console.error(`[ChunkedTranslatedText] Error translating chunk ${i + 1}:`, error)
              updatedChunks[i] = {
                ...updatedChunks[i],
                translated: updatedChunks[i].original,
                loading: false,
                error: true
              }
              hasErrors = true
              setChunks([...updatedChunks])
              resolve()
            }
          })

          batchPromises.push(promise)
        }

        // Wait for current batch to complete before starting next
        await Promise.all(batchPromises)
        
        // Short delay between batches (reduced from 800ms to 400ms)
        if (batchEnd < updatedChunks.length) {
          await new Promise(resolve => setTimeout(resolve, 400))
        }
      }

      setAllTranslated(true)
      if (hasErrors) {
        console.warn('[ChunkedTranslatedText] Some chunks failed to translate, using original text')
      }
    }

    translateChunks()
  }, [chunks.length, targetLang, sourceLang, domain])

  // Show progressive loading with translated content
  const loadingChunks = chunks.filter(chunk => chunk.loading).length
  const totalChunks = chunks.length
  
  if (loadingChunks > 0 && loadingSkeleton) {
    // Show partial content with loading indicator
    const translatedText = chunks
      .map(chunk => chunk.translated || chunk.original)
      .join('\n\n')
    
    return (
      <div className={className}>
        <Component className="opacity-90">
          {translatedText}
        </Component>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <span>Traduzindo... ({totalChunks - loadingChunks}/{totalChunks})</span>
        </div>
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