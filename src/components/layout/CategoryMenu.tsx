import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useCategories } from "@/hooks/useCategories";

const CategoryMenu = () => {
  const { data: categories, isLoading, error } = useCategories();
  const cats = (categories as any[]) ?? [];
  const roots = cats.filter((c) => !c.parent_id);
  const getChildren = (id: string) => cats.filter((c) => c.parent_id === id);

  return (
    <NavigationMenu className="z-50">
      {isLoading || error ? (
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="min-w-[140px]">Categorias</NavigationMenuTrigger>
            <NavigationMenuContent className="p-4 bg-popover text-foreground border border-border rounded-md shadow-lg">
              {isLoading && (
                <div className="px-2 py-1.5 text-sm">Carregando...</div>
              )}
              {error && (
                <div className="px-2 py-1.5 text-sm text-destructive">
                  Erro ao carregar categorias
                </div>
              )}
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      ) : (
        <NavigationMenuList className="max-w-[80vw] overflow-x-auto">
          {roots.map((root: any) => (
            <NavigationMenuItem key={root.id}>
              <NavigationMenuTrigger className="min-w-[120px]">
                {root.name_pt ?? root.slug}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-4 bg-popover text-foreground border border-border rounded-md shadow-lg">
                <div className="w-[min(90vw,640px)]">
                  <div className="mb-3">
                    <Link
                      to={`/explorar?categoria=${encodeURIComponent(root.slug)}`}
                      className="text-sm underline hover:text-primary transition-colors"
                    >
                      Ver todos em {root.name_pt ?? root.slug}
                    </Link>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getChildren(root.id).length === 0 && (
                      <li className="text-sm text-muted-foreground">Sem subcategorias</li>
                    )}
                    {getChildren(root.id).map((child: any) => (
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
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      )}
    </NavigationMenu>
  );
};

export default CategoryMenu;
