import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useShoppingCart } from "@/hooks/useEcommerce";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Lock, ArrowLeft, Package } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { useForm } from "react-hook-form";

interface CheckoutForm {
  email: string;
  fullName: string;
  address: string;
  city: string;
  zipCode: string;
  state: string;
  phone: string;
}

export default function Checkout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const { cartItems, cartTotal, cartCount, clearCart } = useShoppingCart();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CheckoutForm>();

  // Se não houver itens no carrinho, redirecionar
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      const listingId = searchParams.get('listing');
      if (!listingId) {
        navigate('/');
        return;
      }
    }
  }, [cartItems, navigate, searchParams]);

  // Preencher dados do usuário se logado
  useEffect(() => {
    if (user) {
      setValue('email', user.email || '');
      // Buscar dados do perfil se disponível
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (data?.full_name) {
          setValue('fullName', data.full_name);
        }
      };
      fetchProfile();
    }
  }, [user, setValue]);

  const shipping = 0; // Frete grátis por enquanto
  const total = cartTotal + shipping;

  const onSubmit = async (formData: CheckoutForm) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para finalizar a compra.",
        variant: "destructive",
      });
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a compra.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Criar checkout com todos os dados preparados
      const { data, error } = await supabase.functions.invoke("create-product-checkout", {
        body: {
          items: cartItems.map(item => ({
            listing_id: item.listing_id,
            quantity: item.quantity,
            price: item.listings.price,
            title: item.listings.title,
          })),
          seller_id: cartItems[0].listings.user_id,
          customer_data: {
            email: formData.email,
            name: formData.fullName,
            phone: formData.phone,
          },
          shipping_address: {
            line1: formData.address,
            city: formData.city,
            postal_code: formData.zipCode,
            state: formData.state,
            country: 'BR',
          },
          total_amount: total,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("Erro ao criar sessão de pagamento");

      // Redirecionar para o Stripe Checkout
      window.location.href = data.url;
      
    } catch (error: any) {
      toast({
        title: "Erro no checkout",
        description: error.message || "Ocorreu um erro ao processar seu pedido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="container py-8">
        <div className="max-w-md mx-auto text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Carrinho Vazio</h1>
          <p className="text-muted-foreground mb-6">
            Adicione produtos ao seu carrinho para continuar.
          </p>
          <Button onClick={() => navigate('/')}>
            Voltar às Compras
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Checkout - Finalizar Compra"
        description="Finalize sua compra de forma segura no TudoFaz"
      />
      
      <div className="container py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Finalizar Compra</h1>
          <p className="text-muted-foreground">
            Revise seus itens e preencha os dados para finalizar sua compra
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Formulário de Checkout */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Dados para Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="fullName">Nome Completo *</Label>
                      <Input
                        id="fullName"
                        {...register('fullName', { required: 'Nome é obrigatório' })}
                        placeholder="Seu nome completo"
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email', { 
                          required: 'Email é obrigatório',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                        placeholder="seu@email.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      {...register('phone', { required: 'Telefone é obrigatório' })}
                      placeholder="(11) 99999-9999"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Endereço *</Label>
                    <Input
                      id="address"
                      {...register('address', { required: 'Endereço é obrigatório' })}
                      placeholder="Rua, número, complemento"
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        {...register('city', { required: 'Cidade é obrigatória' })}
                        placeholder="Sua cidade"
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        {...register('state', { required: 'Estado é obrigatório' })}
                        placeholder="SP"
                        maxLength={2}
                      />
                      {errors.state && (
                        <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="zipCode">CEP *</Label>
                      <Input
                        id="zipCode"
                        {...register('zipCode', { required: 'CEP é obrigatório' })}
                        placeholder="00000-000"
                      />
                      {errors.zipCode && (
                        <p className="text-sm text-destructive mt-1">{errors.zipCode.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isProcessing || !user}
                      className="w-full"
                      size="lg"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {isProcessing ? "Processando..." : `Pagar R$ ${(total / 100).toFixed(2)}`}
                    </Button>
                    
                    {!user && (
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        Você precisa estar logado para finalizar a compra
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    {item.listings.cover_image && (
                      <img
                        src={item.listings.cover_image}
                        alt={item.listings.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">
                        {item.listings.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        R$ {(item.listings.price / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'itens'})</span>
                    <span>R$ {(cartTotal / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span className="text-green-600">Grátis</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>R$ {(total / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Pagamento 100% seguro via Stripe</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">💳</Badge>
                    <span>Aceitamos cartões de crédito e débito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">🔒</Badge>
                    <span>Seus dados estão protegidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">📱</Badge>
                    <span>PIX e outras formas de pagamento</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}