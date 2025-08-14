import { useState, useEffect, RefObject } from "react";
import { logger } from "@/utils/logger";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({ 
  src, 
  alt, 
  className = "", 
  fallback = "/placeholder.svg",
  onLoad,
  onError 
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
      logger.debug("Image loaded successfully", { src });
    };
    
    img.onerror = () => {
      setImageSrc(fallback);
      setIsLoading(false);
      setHasError(true);
      onError?.();
      logger.warn("Image failed to load", { src, fallback });
    };
    
    img.src = src;
  }, [src, fallback, onLoad, onError]);

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        loading="lazy"
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Imagem não disponível</span>
        </div>
      )}
    </div>
  );
}

// Hook para intersection observer
export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
}