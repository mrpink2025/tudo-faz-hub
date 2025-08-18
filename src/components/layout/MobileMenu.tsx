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
import { useTranslation } from "react-i18next";

const MobileMenu = () => {
  const { data: categories, isLoading, error } = useCategories();
  const { t, i18n } = useTranslation();
  const cats = (categories as any[]) ?? [];
  const roots = cats.filter((c) => !c.parent_id);
  const getChildren = (id: string) => cats.filter((c) => c.parent_id === id);

  // Função para obter nome da categoria traduzido
  const getCategoryName = (category: any) => {
    const lang = (i18n.language || "pt").split("-")[0];
    
    // Traduções estáticas para categorias principais
    const staticTranslations: Record<string, Record<string, string>> = {
      'empregos': {
        'en': 'Jobs',
        'es': 'Empleos', 
        'zh': '工作',
        'pt': 'Empregos'
      },
      'imoveis': {
        'en': 'Real Estate',
        'es': 'Bienes Raíces',
        'zh': '房地产',
        'pt': 'Imóveis'
      },
      'servicos': {
        'en': 'Services',
        'es': 'Servicios',
        'zh': '服务',
        'pt': 'Serviços'
      },
      'veiculos': {
        'en': 'Vehicles',
        'es': 'Vehículos',
        'zh': '车辆',
        'pt': 'Veículos'
      },
      'vida-cotidiana': {
        'en': 'Daily Life',
        'es': 'Vida Cotidiana',
        'zh': '日常生活',
        'pt': 'Vida Cotidiana'
      },
      'servicos-financeiros': {
        'en': 'Financial Services',
        'es': 'Servicios Financieros',
        'zh': '金融服务',
        'pt': 'Serviços Financeiros'
      },
      'eletronicos': {
        'en': 'Electronics',
        'es': 'Electrónicos',
        'zh': '电子产品',
        'pt': 'Eletrônicos'
      },
      'outros': {
        'en': 'Others',
        'es': 'Otros',
        'zh': '其他',
        'pt': 'Outros'
      }
    };

    // Primeiro tenta usar tradução estática baseada no slug
    const slug = category.slug?.toLowerCase();
    if (staticTranslations[slug] && staticTranslations[slug][lang]) {
      return staticTranslations[slug][lang];
    }

    // Depois tenta usar campos do banco de dados
    switch (lang) {
      case 'en':
        return category.name_en || category.name_pt || category.slug;
      case 'es':
        return category.name_es || category.name_pt || category.slug;
      case 'zh':
        return category.name_zh || category.name_pt || category.slug;
      default:
        return category.name_pt || category.slug;
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t("ui.open_menu", "Abrir menu")}>
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="z-[60]">
        <div className="mx-auto w-full max-w-none">
          <DrawerHeader>
            <DrawerTitle>{t("nav.explore")}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-6 max-h-[75vh] overflow-y-auto">
            <div>
              <SearchBar />
            </div>

            <section aria-label={t("categories.menu")} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">{t("categories.menu")}</h3>
              {isLoading && (
                <div className="text-sm">{t("common.loading")}</div>
              )}
              {error && (
                <div className="text-sm text-destructive">{t("categories.error")}</div>
              )}
              {!isLoading && !error && (
                <Accordion type="single" collapsible className="w-full">
                  {roots.map((root: any) => (
                    <AccordionItem key={root.id} value={root.slug}>
                      <AccordionTrigger className="text-base">
                        <span className="truncate">{getCategoryName(root)}</span>
                      </AccordionTrigger>
                       <AccordionContent>
                         <div className="pb-2">
                           <DrawerClose asChild>
                             <Link
                               to={`/explorar?categoria=${encodeURIComponent(root.slug)}`}
                               className="text-sm underline hover:text-primary transition-colors"
                             >
                               {t("categories.view_all", { name: getCategoryName(root) })}
                             </Link>
                           </DrawerClose>
                         </div>
                         <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           {getChildren(root.id).map((child: any) => (
                             <li key={child.id}>
                               <DrawerClose asChild>
                                 <Link
                                   to={`/explorar?categoria=${encodeURIComponent(child.slug)}`}
                                   className="text-sm text-muted-foreground hover:text-foreground transition-colors block py-1"
                                 >
                                   {getCategoryName(child)}
                                 </Link>
                               </DrawerClose>
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
                <Button variant="secondary">{t("ui.close", "Fechar")}</Button>
              </DrawerClose>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileMenu;
