import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export function AffiliateNotifications() {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!user) return;

    // Escutar mudanças na tabela affiliate_requests para notificar anunciantes
    const requestsChannel = supabase
      .channel('affiliate-requests-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'affiliate_requests'
        },
        async (payload) => {
          // Verificar se o anunciante é o usuário atual
          const { data: listing } = await supabase
            .from('listings')
            .select('user_id, title')
            .eq('id', payload.new.listing_id)
            .single();

          if (listing?.user_id === user.id) {
            toast({
              title: "Nova Solicitação de Afiliação!",
              description: `Alguém quer se afiliar ao produto: ${listing.title}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'affiliate_requests'
        },
        async (payload) => {
          // Verificar se é o afiliado atual e se foi aprovado/rejeitado
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('user_id')
            .eq('id', payload.new.affiliate_id)
            .single();

          if (affiliate?.user_id === user.id && payload.old.status !== payload.new.status) {
            const { data: listing } = await supabase
              .from('listings')
              .select('title')
              .eq('id', payload.new.listing_id)
              .single();

            if (payload.new.status === 'approved') {
              toast({
                title: "Afiliação Aprovada! 🎉",
                description: `Sua solicitação para "${listing?.title}" foi aprovada!`,
              });
            } else if (payload.new.status === 'rejected') {
              toast({
                title: "Afiliação Rejeitada",
                description: `Sua solicitação para "${listing?.title}" foi rejeitada.`,
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe();

    // Escutar mudanças de status de pedidos para notificar compradores e afiliados
    const ordersChannel = supabase
      .channel('orders-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          // Verificar se o status mudou e se afeta o usuário atual
          if (payload.old.status !== payload.new.status) {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            // Se for o comprador
            if (payload.new.user_id === currentUser?.id) {
              const statusLabels: Record<string, string> = {
                "pending": "Pendente",
                "in_analysis": "Em Análise", 
                "approved": "Aprovado",
                "canceled": "Cancelado",
              };
              
              const newStatusLabel = statusLabels[payload.new.status] || payload.new.status;
              toast({
                title: "Status do Pedido Atualizado",
                description: `Seu pedido foi alterado para: ${newStatusLabel}`,
                variant: payload.new.status === "approved" ? "default" : 
                         payload.new.status === "canceled" ? "destructive" : "default",
              });
            }
            
            // Se for o afiliado
            if (payload.new.affiliate_id) {
              const { data: affiliate } = await supabase
                .from('affiliates')
                .select('user_id')
                .eq('id', payload.new.affiliate_id)
                .single();

              if (affiliate?.user_id === currentUser?.id) {
                const statusLabels: Record<string, string> = {
                  "pending": "Pendente",
                  "in_analysis": "Em Análise",
                  "approved": "Aprovado",
                  "canceled": "Cancelado",
                };
                
                const newStatusLabel = statusLabels[payload.new.status] || payload.new.status;
                toast({
                  title: "Status da Venda Atualizado",
                  description: `A venda que você indicou foi alterada para: ${newStatusLabel}`,
                  variant: payload.new.status === "approved" ? "default" : 
                           payload.new.status === "canceled" ? "destructive" : "default",
                });
              }
            }
          }
        }
      )
      .subscribe();

    // Escutar mudanças na tabela affiliate_commissions para notificar afiliados
    const commissionsChannel = supabase
      .channel('affiliate-commissions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'affiliate_commissions'
        },
        async (payload) => {
          // Verificar se é o afiliado atual
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('user_id')
            .eq('id', payload.new.affiliate_id)
            .single();

          if (affiliate?.user_id === user.id) {
            const commissionValue = (payload.new.commission_amount / 100).toFixed(2);
            toast({
              title: "Nova Comissão! 💰",
              description: `Você ganhou R$ ${commissionValue} em comissão!`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'affiliate_commissions'
        },
        async (payload) => {
          // Verificar se é o afiliado atual e se o status mudou para 'confirmed' ou 'paid'
          const { data: affiliate } = await supabase
            .from('affiliates')
            .select('user_id')
            .eq('id', payload.new.affiliate_id)
            .single();

          if (affiliate?.user_id === user.id && payload.old.status !== payload.new.status) {
            const commissionValue = (payload.new.commission_amount / 100).toFixed(2);
            
            if (payload.new.status === 'confirmed') {
              toast({
                title: "Comissão Confirmada ✅",
                description: `Sua comissão de R$ ${commissionValue} foi confirmada!`,
              });
            } else if (payload.new.status === 'paid') {
              toast({
                title: "Comissão Paga! 🎉",
                description: `Sua comissão de R$ ${commissionValue} foi paga!`,
              });
            } else if (payload.new.status === 'canceled') {
              toast({
                title: "Comissão Cancelada",
                description: `Sua comissão de R$ ${commissionValue} foi cancelada devido ao cancelamento do pedido.`,
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(commissionsChannel);
    };
  }, [user, toast]);

  return null; // Este componente não renderiza nada, apenas escuta eventos
}