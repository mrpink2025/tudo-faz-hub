import { useAutoTranslate } from '@/hooks/useAutoTranslate'
import { Skeleton } from '@/components/ui/skeleton'

interface TranslatedTextProps {
  text: string
  domain?: string
  sourceLang?: string
  className?: string
  as?: keyof JSX.IntrinsicElements
  loadingSkeleton?: boolean
}

export function TranslatedText({ 
  text, 
  domain, 
  sourceLang,
  className = '',
  as: Component = 'span',
  loadingSkeleton = true
}: TranslatedTextProps) {
  const { data, isLoading, error } = useAutoTranslate(text, {
    domain,
    sourceLang,
    enabled: Boolean(text)
  })

  if (isLoading && loadingSkeleton) {
    return <Skeleton className={`h-4 w-full ${className}`} />
  }

  if (error || !data) {
    return <Component className={className}>{text}</Component>
  }

  return <Component className={className}>{data.translatedText}</Component>
}