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
            {!isLoading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-[min(90vw,800px)]">
                {roots.map((root: any) => (
                  <div key={root.id} className="space-y-2">
                    <Link
                      to={`/explorar?categoria=${encodeURIComponent(root.slug)}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {root.name_pt ?? root.slug}
                    </Link>
                    <ul className="space-y-1">
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
                ))}
              </div>
            )}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default CategoryMenu;
