import { Link } from "react-router-dom";
import { useFeaturedListings } from "@/hooks/useFeaturedListings";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatPrice = (
  value: number | null | undefined,
  currency: string | null | undefined,
  fallback: string,
  locale: string
) => {
  if (value == null) return fallback;
  try {
    // Converter centavos para reais e formatar no padrão brasileiro
    const valueInReais = value / 100;
    return new Intl.NumberFormat('pt-BR', { 
      style: "currency", 
      currency: currency || "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valueInReais);
  } catch {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  }
};

const FeaturedListingsBar = () => {
  const { t, i18n } = useTranslation();
  const { data: listings = [] } = useFeaturedListings(12);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoplayRef = useRef<NodeJS.Timeout>();
  
  if (!listings.length) return null;
  const locale = i18n.language || "pt-BR";

  // Auto-advance carousel
  useEffect(() => {
    if (!isHovered && listings.length > 1) {
      autoplayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % listings.length);
      }, 4000); // Change slide every 4 seconds
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isHovered, listings.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % listings.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + listings.length) % listings.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <aside 
      aria-label="Anúncios em destaque" 
      className="bg-gradient-to-r from-primary/10 via-accent/20 to-primary/10 border-b"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container py-2 overflow-hidden">
        <div className="relative">
          {/* Carousel container */}
          <div className="flex transition-transform duration-500 ease-in-out" 
               style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {listings.map((listing) => (
              <div key={listing.id} className="w-full flex-shrink-0">
                <Link
                  to={`/anuncio/${listing.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/50 transition-all duration-300 group"
                  aria-label={`Ver anúncio em destaque: ${listing.title}`}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden rounded-md bg-muted flex-shrink-0">
                    {listing.cover_image ? (
                      <img
                        src={listing.cover_image}
                        alt={listing.title}
                        className="w-16 h-16 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-2xl">🏷️</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(listing.price, listing.currency, t("price.combined"), locale)}
                    </p>
                    {listing.location && (
                      <p className="text-xs text-muted-foreground truncate">
                        📍 {listing.location}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          {listings.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md h-8 w-8"
                onClick={prevSlide}
                aria-label="Anúncio anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md h-8 w-8"
                onClick={nextSlide}
                aria-label="Próximo anúncio"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Dots indicator */}
          {listings.length > 1 && (
            <div className="flex justify-center mt-2 gap-1">
              {listings.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-primary w-4' 
                      : 'bg-primary/30 hover:bg-primary/50'
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Ir para anúncio ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default FeaturedListingsBar;
