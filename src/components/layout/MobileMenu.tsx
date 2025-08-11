import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import { useCategories } from "@/hooks/useCategories";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const MobileMenu = () => {
  const { data: categories, isLoading, error } = useCategories();
  const cats = (categories as any[]) ?? [];
  const roots = cats.filter((c) => !c.parent_id);
  const getChildren = (id: string) => cats.filter((c) => c.parent_id === id);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="z-[60]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Explorar</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-6 max-h-[75vh] overflow-y-auto">
            <div>
              <SearchBar />
            </div>

            <section aria-label="Categorias" className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Categorias</h3>
              {isLoading && (
                <div className="text-sm">Carregando...</div>
              )}
              {error && (
                <div className="text-sm text-destructive">Erro ao carregar categorias</div>
              )}
              {!isLoading && !error && (
                <Accordion type="single" collapsible className="w-full">
                  {roots.map((root: any) => (
                    <AccordionItem key={root.id} value={root.slug}>
                      <AccordionTrigger className="text-base">
                        <span className="truncate">{root.name_pt ?? root.slug}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pb-2">
                          <Link
                            to={`/explorar?categoria=${encodeURIComponent(root.slug)}`}
                            className="text-sm underline hover:text-primary transition-colors"
                          >
                            Ver todos em {root.name_pt ?? root.slug}
                          </Link>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </section>

            <div className="flex justify-end">
              <DrawerClose asChild>
                <Button variant="secondary">Fechar</Button>
              </DrawerClose>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileMenu;
