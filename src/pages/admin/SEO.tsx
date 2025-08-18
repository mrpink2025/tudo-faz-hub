import { HelmetProvider } from 'react-helmet-async';
import { SEOHead } from '@/components/seo/SEOHead';
import { PWANotifications } from '@/components/pwa/PWANotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Smartphone, Zap, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SEODashboard = () => {
  const { t } = useTranslation();
  
  return (
    <HelmetProvider>
      <SEOHead 
        title="SEO & PWA Dashboard - TudoFaz Hub"
        description="Dashboard para gerenciar SEO, PWA e funcionalidades avançadas do TudoFaz Hub"
        keywords={['seo', 'pwa', 'dashboard', 'performance']}
      />
      
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.seo.title')}</h1>
          <p className="text-muted-foreground">
            {t('admin.seo.subtitle')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.seo.dynamic_sitemap')}</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('admin.seo.active')}</div>
              <p className="text-xs text-muted-foreground">
                {t('admin.seo.auto_updated')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.seo.pwa_installable')}</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('admin.seo.active')}</div>
              <p className="text-xs text-muted-foreground">
                {t('admin.seo.service_worker_active')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.seo.background_sync')}</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('admin.seo.active')}</div>
              <p className="text-xs text-muted-foreground">
                {t('admin.seo.offline_sync')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.seo.meta_tags')}</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('admin.seo.optimized')}</div>
              <p className="text-xs text-muted-foreground">
                {t('admin.seo.seo_complete')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.seo.seo_features')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">✅ {t('admin.seo.implemented')}</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t('admin.seo.dynamic_meta_tags')}</li>
                  <li>• {t('admin.seo.dynamic_sitemap_xml')}</li>
                  <li>• {t('admin.seo.structured_data')}</li>
                  <li>• {t('admin.seo.open_graph')}</li>
                  <li>• {t('admin.seo.twitter_cards')}</li>
                  <li>• {t('admin.seo.canonical_urls')}</li>
                  <li>• {t('admin.seo.mobile_optimization')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.seo.pwa_features')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">✅ {t('admin.seo.implemented')}</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t('admin.seo.optimized_service_worker')}</li>
                  <li>• {t('admin.seo.intelligent_cache')}</li>
                  <li>• {t('admin.seo.offline_capabilities')}</li>
                  <li>• {t('admin.seo.background_sync')}</li>
                  <li>• {t('admin.seo.push_notifications')}</li>
                  <li>• {t('admin.seo.install_prompts')}</li>
                  <li>• {t('admin.seo.app_manifest')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <PWANotifications />

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.seo.useful_links')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-2 md:grid-cols-2">
              <a 
                href="/sitemap.xml" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                {t('admin.seo.view_sitemap')}
              </a>
              <a 
                href="https://jprmzutdujnufjyvxtss.supabase.co/functions/v1/dynamic-sitemap" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                {t('admin.seo.sitemap_api')}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </HelmetProvider>
  );
};

export default SEODashboard;