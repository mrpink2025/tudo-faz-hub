import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const baseUrl = 'https://tudofaz.com';
    const entries: SitemapEntry[] = [];

    // Static pages
    const staticPages = [
      { path: '', priority: 1.0, changefreq: 'daily' as const },
      { path: '/explorar', priority: 0.9, changefreq: 'daily' as const },
      { path: '/entrar', priority: 0.5, changefreq: 'monthly' as const },
      { path: '/termos', priority: 0.3, changefreq: 'yearly' as const },
      { path: '/privacidade', priority: 0.3, changefreq: 'yearly' as const },
    ];

    staticPages.forEach(page => {
      entries.push({
        url: `${baseUrl}${page.path}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: page.changefreq,
        priority: page.priority
      });
    });

    // Dynamic listings
    const { data: listings } = await supabaseClient
      .from('listings')
      .select('id, title, updated_at, created_at')
      .eq('approved', true)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(10000); // Reasonable limit for sitemap

    if (listings) {
      listings.forEach(listing => {
        entries.push({
          url: `${baseUrl}/anuncio/${listing.id}`,
          lastmod: new Date(listing.updated_at || listing.created_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.8
        });
      });
    }

    // Categories (if you have a categories table or predefined categories)
    const categories = [
      'servicos', 'produtos', 'veiculos', 'imoveis', 'tecnologia', 
      'moda', 'casa-jardim', 'esportes', 'livros', 'animais'
    ];

    categories.forEach(category => {
      entries.push({
        url: `${baseUrl}/explorar?categoria=${category}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: 0.7
      });
    });

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});