import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ContactSellerButtonProps {
  sellerId: string;
  sellerName?: string;
  sellerEmail?: string;
  listingTitle?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive' | 'hero';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const ContactSellerButton: React.FC<ContactSellerButtonProps> = ({
  sellerId,
  sellerName,
  sellerEmail,
  listingTitle,
  variant = 'default',
  size = 'default',
  className
}) => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleContactSeller = () => {
    if (!user) {
      toast.error('Você precisa estar logado para enviar mensagens');
      navigate('/entrar');
      return;
    }

    if (user.id === sellerId) {
      toast.error('Você não pode enviar mensagem para si mesmo');
      return;
    }

    // Navegar para mensagens com o vendedor selecionado
    navigate('/mensagens', { 
      state: { 
        selectedUserId: sellerId,
        selectedUserName: sellerName || sellerEmail, // Usar nome se disponível, senão email
        selectedUserEmail: sellerEmail,
        initialMessage: listingTitle ? `Olá! Tenho interesse no anúncio: ${listingTitle}` : undefined
      }
    });
  };

  return (
    <Button
      onClick={handleContactSeller}
      variant={variant}
      size={size}
      className={className}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Contatar Vendedor
    </Button>
  );
};

export default ContactSellerButton;