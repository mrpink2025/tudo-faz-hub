import { HelmetProvider } from 'react-helmet-async';
import { SEOHead } from '@/components/seo/SEOHead';
import { PWANotifications } from '@/components/pwa/PWANotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Smartphone, Zap, Search } from 'lucide-react';

const SEODashboard = () => {
  return (
    <HelmetProvider>
      <SEOHead 
        title="SEO & PWA Dashboard - TudoFaz Hub"
        description="Dashboard para gerenciar SEO, PWA e funcionalidades avançadas do TudoFaz Hub"
        keywords={['seo', 'pwa', 'dashboard', 'performance']}
      />
      
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO & PWA Dashboard</h1>
          <p className="text-muted-foreground">
            Gerencie SEO, PWA e funcionalidades avançadas da plataforma
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sitemap Dinâmico</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ativo</div>
              <p className="text-xs text-muted-foreground">
                Atualizado automaticamente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PWA Instalável</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ativo</div>
              <p className="text-xs text-muted-foreground">
                Service Worker ativo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Background Sync</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ativo</div>
              <p className="text-xs text-muted-foreground">
                Sincronização offline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meta Tags</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Otimizado</div>
              <p className="text-xs text-muted-foreground">
                SEO completo
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">✅ Implementado</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Meta tags dinâmicas por página</li>
                  <li>• Sitemap.xml dinâmico</li>
                  <li>• Structured data (JSON-LD)</li>
                  <li>• Open Graph tags</li>
                  <li>• Twitter Cards</li>
                  <li>• Canonical URLs</li>
                  <li>• Mobile optimization</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades PWA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">✅ Implementado</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Service Worker otimizado</li>
                  <li>• Cache inteligente</li>
                  <li>• Offline capabilities</li>
                  <li>• Background sync</li>
                  <li>• Push notifications</li>
                  <li>• Install prompts</li>
                  <li>• App manifest</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <PWANotifications />

        <Card>
          <CardHeader>
            <CardTitle>Links Úteis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-2 md:grid-cols-2">
              <a 
                href="/sitemap.xml" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                Ver Sitemap Dinâmico →
              </a>
              <a 
                href="https://jprmzutdujnufjyvxtss.supabase.co/functions/v1/dynamic-sitemap" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                API do Sitemap →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </HelmetProvider>
  );
};

export default SEODashboard;