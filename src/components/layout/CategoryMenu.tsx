import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useCategories } from "@/hooks/useCategories";
import { useState } from "react";

const CategoryMenu = () => {
  const { data: categories, isLoading, error } = useCategories();
  const cats = (categories as any[]) ?? [];
  const roots = cats.filter((c) => !c.parent_id);
  const getChildren = (id: string) => cats.filter((c) => c.parent_id === id);

  const [active, setActive] = useState<string | null>(null);
  const highlightedId = active ?? roots[0]?.id;
  const currentRoot = roots.find((r: any) => r.id === highlightedId);


  return (
    <NavigationMenu className="z-50">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="min-w-[140px] text-[hsl(var(--foreground))] hover:bg-white/10">Categorias</NavigationMenuTrigger>
          <NavigationMenuContent className="p-4 bg-popover text-foreground border border-border rounded-md shadow-lg">
            {isLoading && (
              <div className="px-2 py-1.5 text-sm">Carregando...</div>
            )}
            {error && (
              <div className="px-2 py-1.5 text-sm text-destructive">
                Erro ao carregar categorias
              </div>
            )}
            {!isLoading && !error && roots.length > 0 && (
              <div className="w-[min(90vw,900px)] grid grid-cols-1 sm:grid-cols-3 gap-6">
                <aside className="sm:col-span-1 max-h-[360px] overflow-y-auto pr-2 border-r border-border">
                  <ul className="space-y-1">
                    {roots.map((root: any) => {
                      const isActive = highlightedId === root.id;
                      return (
                        <li key={root.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActive(root.id)}
                            onFocus={() => setActive(root.id)}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${isActive ? "bg-muted text-foreground" : "hover:bg-muted/60"}`}
                            aria-haspopup="menu"
                            aria-expanded={isActive}
                          >
                            <span className="truncate">{root.name_pt ?? root.slug}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </aside>
                <section className="sm:col-span-2">
                  {currentRoot ? (
                    <>
                      <div className="mb-3">
                        <Link
                          to={`/explorar?categoria=${encodeURIComponent(currentRoot.slug)}`}
                          className="text-sm underline hover:text-primary transition-colors"
                        >
                          Ver todos em {currentRoot.name_pt ?? currentRoot.slug}
                        </Link>
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {getChildren(currentRoot.id).length === 0 && (
                          <li className="text-sm text-muted-foreground">Sem subcategorias</li>
                        )}
                        {getChildren(currentRoot.id).map((child: any) => (
                          <li key={child.id}>
                            <Link
                              to={`/explorar?categoria=${encodeURIComponent(child.slug)}`}
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {child.name_pt ?? child.slug}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhuma categoria disponível</div>
                  )}
                </section>
              </div>
            )}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default CategoryMenu;
