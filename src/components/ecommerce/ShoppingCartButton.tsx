import { useState } from "react";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { useShoppingCart } from "@/hooks/useEcommerce";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function ShoppingCartButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, isLoading } = useShoppingCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) return;
    
    // Redirecionar para página de checkout interna
    navigate('/checkout');
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-white/10 border-white/20 hover:bg-white/20 text-white">
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {cartCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Carrinho de Compras</SheetTitle>
          <SheetDescription>
            {cartCount > 0 ? `${cartCount} item(s) no carrinho` : "Seu carrinho está vazio"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 py-6">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Carregando...</div>
          ) : cartItems && cartItems.length > 0 ? (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      {item.listings.cover_image && (
                        <img
                          src={item.listings.cover_image}
                          alt={item.listings.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.listings.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          R$ {(item.listings.price / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Produto do marketplace
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity.mutate({
                                  cartId: item.id,
                                  quantity: item.quantity - 1,
                                })
                              }
                              disabled={updateQuantity.isPending}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity.mutate({
                                  cartId: item.id,
                                  quantity: item.quantity + 1,
                                })
                              }
                              disabled={updateQuantity.isPending}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeFromCart.mutate(item.id)}
                            disabled={removeFromCart.isPending}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Seu carrinho está vazio</p>
            </div>
          )}
        </div>

        {cartItems && cartItems.length > 0 && (
          <SheetFooter className="flex-col space-y-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span>R$ {(cartTotal / 100).toFixed(2)}</span>
            </div>
            <Button 
              onClick={handleCheckout} 
              className="w-full"
              disabled={cartItems.length === 0}
            >
              Finalizar Compra
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}