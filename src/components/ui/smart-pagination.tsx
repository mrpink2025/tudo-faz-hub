import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  siblingCount?: number;
  className?: string;
}

export function SmartPagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
  className
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

    // Always show first page
    if (showFirstLast && currentPage > siblingCount + 1) {
      pages.push(1);
      if (shouldShowLeftEllipsis) {
        pages.push('ellipsis');
      }
    }

    // Add pages around current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      pages.push(i);
    }

    // Always show last page
    if (showFirstLast && currentPage < totalPages - siblingCount) {
      if (shouldShowRightEllipsis) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <nav className={cn("flex items-center justify-center space-x-1", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Página anterior</span>
      </Button>

      {pages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          );
        }

        const isActive = page === currentPage;
        return (
          <Button
            key={page}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="h-8 w-8 p-0"
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Próxima página</span>
      </Button>
    </nav>
  );
}

interface PaginationInfoProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  className?: string;
}

export function PaginationInfo({
  currentPage,
  pageSize,
  totalCount,
  className
}: PaginationInfoProps) {
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  if (totalCount === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Nenhum resultado encontrado
      </p>
    );
  }

  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      Mostrando {startIndex}-{endIndex} de {totalCount} resultados
    </p>
  );
}

interface PageSizeSelectProps {
  pageSize: number;
  options?: number[];
  onPageSizeChange: (size: number) => void;
  className?: string;
}

export function PageSizeSelect({
  pageSize,
  options = [12, 24, 48],
  onPageSizeChange,
  className
}: PageSizeSelectProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className="text-sm text-muted-foreground">Itens por página:</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
        className="text-sm border rounded px-2 py-1 bg-background"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}