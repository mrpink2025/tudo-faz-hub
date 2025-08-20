import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  MapPin, 
  Phone, 
  Calendar, 
  Camera, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Home,
  Building,
  User2
} from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Address {
  id: string;
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  bio: string;
  avatar_url: string;
}

export default function Profile() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birth_date: "",
    bio: "",
    avatar_url: "",
  });
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    name: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Brasil",
    is_default: false,
  });

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user addresses
  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user?.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Load profile data when fetched
  useEffect(() => {
    if (profile) {
      setProfileData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        birth_date: profile.birth_date || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Perfil atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditingProfile(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload avatar mutation
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const fileName = `${user?.id}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(`avatars/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(`avatars/${fileName}`);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: (avatarUrl) => {
      setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }));
      toast({ title: "Foto de perfil atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao fazer upload da foto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add address mutation
  const addAddress = useMutation({
    mutationFn: async (address: Partial<Address>) => {
      // Ensure required fields are present
      const requiredFields = {
        name: address.name || "",
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        postal_code: address.postal_code || "",
        country: address.country || "Brasil",
      };
      
      const { error } = await supabase
        .from("user_addresses")
        .insert({ ...requiredFields, ...address, user_id: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Endereço adicionado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setIsAddingAddress(false);
      setNewAddress({
        name: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Brasil",
        is_default: false,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar endereço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update address mutation
  const updateAddress = useMutation({
    mutationFn: async ({ id, ...data }: Address) => {
      const { error } = await supabase
        .from("user_addresses")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Endereço atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setEditingAddress(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar endereço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete address mutation
  const deleteAddress = useMutation({
    mutationFn: async (addressId: string) => {
      const { error } = await supabase
        .from("user_addresses")
        .delete()
        .eq("id", addressId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Endereço removido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover endereço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(profileData);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      updateAddress.mutate({ ...editingAddress, ...newAddress } as Address);
    } else {
      addAddress.mutate(newAddress);
    }
  };

  const startEditingAddress = (address: Address) => {
    setEditingAddress(address);
    setNewAddress(address);
    setIsAddingAddress(true);
  };

  const cancelEditingAddress = () => {
    setEditingAddress(null);
    setIsAddingAddress(false);
    setNewAddress({
      name: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      postal_code: "",
      country: "Brasil",
      is_default: false,
    });
  };

  if (profileLoading || addressesLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Meu Perfil - tudofaz.com"
        description="Gerencie seu perfil pessoal, endereços e configurações"
      />
      
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User2 className="w-8 h-8" />
            Meu Perfil
          </h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e endereços</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações Pessoais
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereços
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Perfil Pessoal
                  {!isEditingProfile && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profileData.avatar_url} />
                        <AvatarFallback className="text-lg">
                          {profileData.first_name?.[0]}{profileData.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                        <Camera className="w-4 h-4" />
                      </label>
                      
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadAvatar.isPending}
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold">
                        {profileData.first_name} {profileData.last_name}
                      </h3>
                      <p className="text-muted-foreground">{profileData.email}</p>
                      {uploadAvatar.isPending && (
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Profile Form */}
                  {isEditingProfile ? (
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">Nome</Label>
                          <Input
                            id="first_name"
                            value={profileData.first_name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="last_name">Sobrenome</Label>
                          <Input
                            id="last_name"
                            value={profileData.last_name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="birth_date">Data de Nascimento</Label>
                          <Input
                            id="birth_date"
                            type="date"
                            value={profileData.birth_date}
                            onChange={(e) => setProfileData(prev => ({ ...prev, birth_date: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio">Biografia</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Conte um pouco sobre você..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={updateProfile.isPending}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updateProfile.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditingProfile(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Nome:</span>
                          <span>{profileData.first_name} {profileData.last_name}</span>
                        </div>
                        
                        {profileData.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Telefone:</span>
                            <span>{profileData.phone}</span>
                          </div>
                        )}
                      </div>

                      {profileData.birth_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Data de Nascimento:</span>
                          <span>{new Date(profileData.birth_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}

                      {profileData.bio && (
                        <div>
                          <span className="font-medium">Biografia:</span>
                          <p className="mt-1 text-muted-foreground">{profileData.bio}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Meus Endereços
                  <Button
                    onClick={() => setIsAddingAddress(true)}
                    disabled={isAddingAddress}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Endereço
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add/Edit Address Form */}
                  {isAddingAddress && (
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingAddress ? "Editar Endereço" : "Novo Endereço"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="address_name">Nome do Endereço</Label>
                            <Input
                              id="address_name"
                              value={newAddress.name}
                              onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Casa, Trabalho, etc."
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <Label htmlFor="street">Rua/Avenida</Label>
                              <Input
                                id="street"
                                value={newAddress.street}
                                onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                                required
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="number">Número</Label>
                              <Input
                                id="number"
                                value={newAddress.number}
                                onChange={(e) => setNewAddress(prev => ({ ...prev, number: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="complement">Complemento</Label>
                              <Input
                                id="complement"
                                value={newAddress.complement}
                                onChange={(e) => setNewAddress(prev => ({ ...prev, complement: e.target.value }))}
                                placeholder="Apto, Bloco, etc."
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="neighborhood">Bairro</Label>
                              <Input
                                id="neighborhood"
                                value={newAddress.neighborhood}
                                onChange={(e) => setNewAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="city">Cidade</Label>
                              <Input
                                id="city"
                                value={newAddress.city}
                                onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                                required
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="state">Estado</Label>
                              <Input
                                id="state"
                                value={newAddress.state}
                                onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                                required
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="postal_code">CEP</Label>
                              <Input
                                id="postal_code"
                                value={newAddress.postal_code}
                                onChange={(e) => setNewAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                                placeholder="00000-000"
                                required
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="is_default"
                              checked={newAddress.is_default}
                              onCheckedChange={(checked) => setNewAddress(prev => ({ ...prev, is_default: checked }))}
                            />
                            <Label htmlFor="is_default">Endereço principal</Label>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              disabled={addAddress.isPending || updateAddress.isPending}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {editingAddress ? "Atualizar" : "Adicionar"}
                            </Button>
                            
                            <Button
                              type="button"
                              variant="outline"
                              onClick={cancelEditingAddress}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Addresses List */}
                  {addresses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum endereço cadastrado ainda.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {addresses.map((address) => (
                        <Card key={address.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{address.name}</h4>
                                  {address.is_default && (
                                    <Badge variant="default">Principal</Badge>
                                  )}
                                </div>
                                
                                <div className="text-sm text-muted-foreground">
                                  <p>
                                    {address.street}
                                    {address.number && `, ${address.number}`}
                                    {address.complement && `, ${address.complement}`}
                                  </p>
                                  {address.neighborhood && (
                                    <p>{address.neighborhood}</p>
                                  )}
                                  <p>{address.city}, {address.state}</p>
                                  <p>CEP: {address.postal_code}</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditingAddress(address)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir este endereço? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteAddress.mutate(address.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}