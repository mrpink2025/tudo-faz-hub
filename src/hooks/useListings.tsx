import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { usePagination } from "./usePagination";
import { optimizeQuery } from "@/utils/queryOptimization";
import { logger } from "@/utils/logger";
import { useMemo } from "react";

export type ListingsFilter = {
  categorySlug?: string;
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  highlighted?: boolean;
  pageSize?: number;
};

interface UseListingsOptions {
  enabled?: boolean;
  staleTime?: number;
}

export const useListings = (
  filters: ListingsFilter = {}, 
  passedCategories?: any[],
  options: UseListingsOptions = {}
) => {
  const { data: cats } = useCategories();
  const categories = passedCategories ?? cats ?? [];
  
  const [paginationState, paginationActions] = usePagination({
    pageSize: filters.pageSize || 12,
    totalCount: 0
  });

  // Memoize query configuration for optimization
  const queryConfig = useMemo(() => {
    const { currentPage, pageSize } = paginationState;
    const offset = (currentPage - 1) * pageSize;
    
    return {
      ...filters,
      limit: pageSize,
      offset,
      categories: categories?.length || 0
    };
  }, [filters, paginationState, categories?.length]);

  const query = useQuery({
    queryKey: ["listings", queryConfig],
    queryFn: async () => {
      const { categorySlug, search, location, minPrice, maxPrice, highlighted } = filters;
      const { offset, limit } = queryConfig;

      // Handle category filtering
      let categoryIds: string[] | undefined = undefined;
      if (categorySlug && categories.length) {
        const selected = categories.find((c: any) => c.slug === categorySlug);
        if (selected) {
          const root = selected.parent_id
            ? categories.find((c: any) => c.id === selected.parent_id)
            : selected;
          const children = categories.filter((c: any) => c.parent_id === root.id);
          categoryIds = [root.id, ...children.map((c: any) => c.id)];
        }
      }

      const queryFunction = async () => {
        let query = supabase
          .from("listings")
          .select("id, title, price, currency, location, created_at, category_id, cover_image", { count: 'exact' })
          .eq("approved", true)
          .eq("status", "published");

        // Apply category filter
        if (categoryIds && categoryIds.length) {
          query = query.in("category_id", categoryIds);
        }

        // Apply search filter
        if (search) {
          query = query.or(`title.ilike.%${search}%, description.ilike.%${search}%`);
        }

        // Apply location filter
        if (location) {
          query = query.ilike("location", `%${location}%`);
        }

        // Apply price filters
        if (minPrice !== undefined) {
          query = query.gte("price", minPrice);
        }

        if (maxPrice !== undefined) {
          query = query.lte("price", maxPrice);
        }

        // Apply highlighted filter
        if (highlighted) {
          query = query.eq("highlighted", true);
        }

        // Apply ordering and pagination
        query = query
          .order(highlighted ? "highlighted" : "created_at", { ascending: false })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return { 
          listings: data || [], 
          totalCount: count || 0,
          currentPage: paginationState.currentPage,
          pageSize: limit
        };
      };

      const result = await optimizeQuery(
        queryFunction,
        {
          key: `listings_${JSON.stringify(queryConfig)}`,
          ttl: 30000, // 30 seconds cache
          enableCache: true
        }
      );

      // Update pagination total count
      paginationActions.setTotalCount(result.totalCount);

      logger.info('Listings fetched with pagination', {
        count: result.listings.length,
        totalCount: result.totalCount,
        currentPage: result.currentPage,
        pageSize: result.pageSize,
        filters
      });

      return result;
    },
    staleTime: options.staleTime || 30000, // 30 seconds
    enabled: options.enabled !== false,
  });

  return {
    ...query,
    data: query.data?.listings || [],
    totalCount: query.data?.totalCount || 0,
    pagination: paginationState,
    paginationActions,
    hasNextPage: paginationState.hasNextPage,
    hasPreviousPage: paginationState.hasPreviousPage
  };
};