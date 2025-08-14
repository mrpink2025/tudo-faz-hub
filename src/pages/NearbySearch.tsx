import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Search, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Map from "@/components/ui/map";
import { AdvancedSearchFilters } from "@/components/search/AdvancedSearchFilters";
import { PWAManager } from "@/components/pwa/PWAManager";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface NearbySearchPageProps {}

export default function NearbySearchPage({}: NearbySearchPageProps) {
  const { t } = useTranslation();
  const { user } = useSupabaseAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [nearbyListings, setNearbyListings] = useState<any[]>([]);

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setUserLocation({ lat, lng });
    // In a real implementation, this would fetch nearby listings
    console.log('Location selected:', { lat, lng, address });
  };

  const handleFiltersChange = (filters: any) => {
    console.log('Filters changed:', filters);
    // In a real implementation, this would filter the listings
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('nearby.title')}</h1>
          <p className="text-muted-foreground">
            Descubra anúncios e serviços próximos à sua localização
          </p>
        </div>

        {/* Features Showcase */}
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map">Mapa Interativo</TabsTrigger>
            <TabsTrigger value="search">Busca Avançada</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="pwa">App Móvel</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Explorar por Localização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Clique no mapa para selecionar uma localização e encontrar anúncios próximos.
                </p>
                <Map
                  onLocationSelect={handleLocationSelect}
                  initialLocation={userLocation || undefined}
                  listings={nearbyListings}
                  showListings={true}
                  height="400px"
                />
                
                {userLocation && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <strong>Localização selecionada:</strong><br />
                      Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="search" className="space-y-4">
            <AdvancedSearchFilters
              onFiltersChange={handleFiltersChange}
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Busca</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use os filtros avançados acima para refinar sua busca e encontrar exatamente o que procura.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Mock results */}
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 border rounded-lg">
                      <h3 className="font-semibold">Anúncio Exemplo {i}</h3>
                      <p className="text-sm text-muted-foreground">
                        Descrição do anúncio de exemplo...
                      </p>
                      <div className="mt-2">
                        <Badge variant="secondary">R$ {(Math.random() * 1000 + 100).toFixed(0)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Notificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Receba notificações em tempo real sobre novos anúncios, mensagens e atualizações importantes.
                </p>
                
                <div className="flex justify-center">
                  <NotificationCenter />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Recursos de Notificação:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Notificações push do browser</li>
                    <li>• Alertas de novas mensagens</li>
                    <li>• Novos anúncios em categorias favoritas</li>
                    <li>• Configurações personalizáveis</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pwa" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <PWAManager />
              
              <Card>
                <CardHeader>
                  <CardTitle>Recursos PWA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Offline</Badge>
                      <span className="text-sm">Funciona sem internet</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Instalável</Badge>
                      <span className="text-sm">Como app nativo</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Push</Badge>
                      <span className="text-sm">Notificações em tempo real</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Rápido</Badge>
                      <span className="text-sm">Cache inteligente</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      O TudoFaz funciona como um Progressive Web App (PWA), 
                      oferecendo uma experiência similar a um aplicativo nativo 
                      diretamente no seu navegador.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}