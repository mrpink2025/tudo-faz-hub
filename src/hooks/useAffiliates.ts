import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAffiliates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hook para buscar perfil de afiliado do usuário atual
  const { data: affiliateProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["affiliate-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Hook para criar perfil de afiliado
  const createAffiliate = useMutation({
    mutationFn: async (data: { pix_key?: string; bank_account?: any }) => {
      // Gerar código único
      const { data: codeData, error: codeError } = await supabase.rpc('generate_affiliate_code');
      if (codeError) throw codeError;

      const { data: result, error } = await supabase
        .from("affiliates")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          affiliate_code: codeData,
          pix_key: data.pix_key,
          bank_account: data.bank_account,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({ title: "Perfil de afiliado criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["affiliate-profile"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar perfil de afiliado", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Hook para atualizar perfil de afiliado
  const updateAffiliate = useMutation({
    mutationFn: async (data: { pix_key?: string; bank_account?: any }) => {
      if (!affiliateProfile?.id) throw new Error("Perfil de afiliado não encontrado");
      
      const { data: result, error } = await supabase
        .from("affiliates")
        .update(data)
        .eq("id", affiliateProfile.id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({ title: "Perfil atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["affiliate-profile"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar perfil", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return {
    affiliateProfile,
    profileLoading,
    createAffiliate,
    updateAffiliate,
  };
}

export function useAffiliateListings() {
  // Hook para buscar anúncios disponíveis para afiliação
  const { data: availableListings, isLoading } = useQuery({
    queryKey: ["affiliate-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id, title, price, currency, cover_image, 
          affiliate_enabled, affiliate_commission_rate,
          profiles!listings_user_id_fkey(full_name, email)
        `)
        .eq("affiliate_enabled", true)
        .eq("approved", true)
        .eq("status", "published");
      if (error) throw error;
      return data;
    },
  });

  return {
    availableListings,
    isLoading,
  };
}

export function useAffiliateRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hook para buscar solicitações de afiliação do usuário
  const { data: myRequests, isLoading } = useQuery({
    queryKey: ["my-affiliate-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_requests")
        .select(`
          *, 
          listings(id, title, cover_image, affiliate_commission_rate),
          affiliates(affiliate_code)
        `);
      if (error) throw error;
      return data;
    },
  });

  // Hook para solicitar afiliação
  const requestAffiliation = useMutation({
    mutationFn: async ({ listingId, message }: { listingId: string; message?: string }) => {
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id")
        .single();
      
      if (!affiliate) throw new Error("Você precisa criar um perfil de afiliado primeiro");

      const { data, error } = await supabase
        .from("affiliate_requests")
        .insert({
          affiliate_id: affiliate.id,
          listing_id: listingId,
          message,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Solicitação enviada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["my-affiliate-requests"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao enviar solicitação", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return {
    myRequests,
    isLoading,
    requestAffiliation,
  };
}

export function useAffiliateLinks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hook para buscar links de afiliado do usuário
  const { data: myLinks, isLoading } = useQuery({
    queryKey: ["my-affiliate-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select(`
          *, 
          listings(id, title, cover_image, price, currency),
          affiliates(affiliate_code)
        `);
      if (error) throw error;
      return data;
    },
  });

  // Hook para criar link de afiliado
  const createAffiliateLink = useMutation({
    mutationFn: async (listingId: string) => {
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id")
        .single();
      
      if (!affiliate) throw new Error("Perfil de afiliado não encontrado");

      // Gerar código de tracking único
      const { data: trackingCode, error: trackingError } = await supabase.rpc('generate_tracking_code');
      if (trackingError) throw trackingError;

      const { data, error } = await supabase
        .from("affiliate_links")
        .insert({
          affiliate_id: affiliate.id,
          listing_id: listingId,
          tracking_code: trackingCode,
        })
        .select(`
          *, 
          listings(id, title, cover_image, price, currency)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Link de afiliado criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["my-affiliate-links"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar link", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return {
    myLinks,
    isLoading,
    createAffiliateLink,
  };
}

export function useAffiliateCommissions() {
  // Hook para buscar comissões do afiliado
  const { data: commissions, isLoading } = useQuery({
    queryKey: ["affiliate-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_commissions")
        .select(`
          *, 
          orders(id, amount, created_at),
          listings(id, title)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Hook para buscar estatísticas de comissões
  const { data: stats } = useQuery({
    queryKey: ["affiliate-stats"],
    queryFn: async () => {
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("total_earnings, available_balance, withdrawn_balance")
        .single();
      
      if (!affiliate) return null;

      // Contar cliques totais
      const { count: totalClicks } = await supabase
        .from("affiliate_clicks")
        .select("*", { count: "exact", head: true })
        .in("affiliate_link_id", 
          await supabase
            .from("affiliate_links")
            .select("id")
            .then(res => res.data?.map(l => l.id) || [])
        );

      // Contar vendas convertidas
      const { count: totalSales } = await supabase
        .from("affiliate_commissions")
        .select("*", { count: "exact", head: true });

      return {
        ...affiliate,
        totalClicks: totalClicks || 0,
        totalSales: totalSales || 0,
      };
    },
  });

  return {
    commissions,
    stats,
    isLoading,
  };
}