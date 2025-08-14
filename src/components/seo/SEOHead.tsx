import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'product';
  price?: number;
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  category?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
  structuredData?: Record<string, any>;
}

export const SEOHead = ({
  title = 'TudoFaz Hub - Marketplace de Serviços e Produtos',
  description = 'Encontre os melhores serviços e produtos na sua região. Marketplace completo com mais de 1000 categorias disponíveis.',
  keywords = ['marketplace', 'serviços', 'produtos', 'classificados', 'brasil'],
  image = '/og-image.jpg',
  type = 'website',
  price,
  currency = 'BRL',
  availability,
  category,
  publishedTime,
  modifiedTime,
  author,
  noIndex = false,
  canonicalUrl,
  structuredData
}: SEOProps) => {
  const location = useLocation();
  const currentUrl = `${window.location.origin}${location.pathname}`;
  const finalCanonicalUrl = canonicalUrl || currentUrl;
  const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

  // Generate structured data
  const generateStructuredData = () => {
    if (structuredData) return structuredData;

    const baseData = {
      "@context": "https://schema.org",
      "@type": type === 'product' ? 'Product' : 'WebPage',
      "name": title,
      "description": description,
      "url": currentUrl,
      "image": fullImageUrl,
      "publisher": {
        "@type": "Organization",
        "name": "TudoFaz Hub",
        "url": window.location.origin,
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/logo.png`
        }
      }
    };

    if (type === 'product' && price) {
      return {
        ...baseData,
        "offers": {
          "@type": "Offer",
          "price": price,
          "priceCurrency": currency,
          "availability": `https://schema.org/${availability || 'InStock'}`,
          "seller": {
            "@type": "Organization",
            "name": "TudoFaz Hub"
          }
        },
        "category": category
      };
    }

    if (type === 'article') {
      return {
        ...baseData,
        "@type": "Article",
        "headline": title,
        "datePublished": publishedTime,
        "dateModified": modifiedTime,
        "author": {
          "@type": "Person",
          "name": author
        }
      };
    }

    return baseData;
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={finalCanonicalUrl} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="TudoFaz Hub" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Product specific OG tags */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
          <meta property="product:availability" content={availability || 'in_stock'} />
          {category && <meta property="product:category" content={category} />}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#000000" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Performance hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//jprmzutdujnufjyvxtss.supabase.co" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(generateStructuredData())}
      </script>
    </Helmet>
  );
};