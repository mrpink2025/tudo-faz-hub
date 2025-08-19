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
    
    // Traduções estáticas para todas as categorias e subcategorias
    const staticTranslations: Record<string, Record<string, string>> = {
      // Categorias principais
      'veiculos': {
        'en': 'Vehicles & Transportation',
        'es': 'Vehículos y Transporte', 
        'zh': '车辆与交通',
        'pt': 'Veículos e Transportes'
      },
      'imoveis': {
        'en': 'Real Estate',
        'es': 'Bienes Raíces',
        'zh': '房地产',
        'pt': 'Imóveis'
      },
      'empregos': {
        'en': 'Jobs & Careers',
        'es': 'Empleos y Carreras',
        'zh': '工作与职业',
        'pt': 'Empregos e Carreiras'
      },
      'eletronicos': {
        'en': 'Electronics & Technology',
        'es': 'Electrónicos y Tecnología',
        'zh': '电子产品与技术',
        'pt': 'Eletrônicos e Tecnologia'
      },
      'casa-decoracao': {
        'en': 'Home & Decoration',
        'es': 'Casa y Decoración',
        'zh': '家居与装饰',
        'pt': 'Casa e Decoração'
      },
      'moda-beleza': {
        'en': 'Fashion & Beauty',
        'es': 'Moda y Belleza',
        'zh': '时尚与美容',
        'pt': 'Moda e Beleza'
      },
      'esportes-lazer': {
        'en': 'Sports & Leisure',
        'es': 'Deportes y Ocio',
        'zh': '体育与休闲',
        'pt': 'Esportes e Lazer'
      },
      'servicos': {
        'en': 'Services',
        'es': 'Servicios',
        'zh': '服务',
        'pt': 'Serviços'
      },
      'animais-pets': {
        'en': 'Animals & Pets',
        'es': 'Animales y Mascotas',
        'zh': '动物与宠物',
        'pt': 'Animais e Pets'
      },
      'outros': {
        'en': 'Others',
        'es': 'Otros',
        'zh': '其他',
        'pt': 'Outros'
      },
      // Todas as subcategorias com traduções completas
      'carros': { 'en': 'Cars', 'es': 'Coches', 'zh': '汽车', 'pt': 'Carros' },
      'motos': { 'en': 'Motorcycles & Scooters', 'es': 'Motos y Scooters', 'zh': '摩托车与踏板车', 'pt': 'Motos e Scooters' },
      'caminhoes': { 'en': 'Trucks & Commercial', 'es': 'Camiones y Comerciales', 'zh': '卡车与商用车', 'pt': 'Caminhões e Comerciais' },
      'barcos': { 'en': 'Boats & Nautical', 'es': 'Barcos y Náutica', 'zh': '船只与航海', 'pt': 'Barcos e Náutica' },
      'bicicletas': { 'en': 'Bicycles', 'es': 'Bicicletas', 'zh': '自行车', 'pt': 'Bicicletas' },
      'pecas-auto': { 'en': 'Parts & Accessories', 'es': 'Piezas y Accesorios', 'zh': '配件与零件', 'pt': 'Peças e Acessórios' },
      'apartamentos-venda': { 'en': 'Apartments for Sale', 'es': 'Apartamentos en Venta', 'zh': '出售公寓', 'pt': 'Apartamentos à Venda' },
      'casas-venda': { 'en': 'Houses for Sale', 'es': 'Casas en Venta', 'zh': '出售房屋', 'pt': 'Casas à Venda' },
      'apartamentos-aluguel': { 'en': 'Apartments for Rent', 'es': 'Apartamentos en Alquiler', 'zh': '出租公寓', 'pt': 'Apartamentos para Alugar' },
      'casas-aluguel': { 'en': 'Houses for Rent', 'es': 'Casas en Alquiler', 'zh': '出租房屋', 'pt': 'Casas para Alugar' },
      'terrenos': { 'en': 'Land & Lots', 'es': 'Terrenos y Lotes', 'zh': '土地与地块', 'pt': 'Terrenos e Lotes' },
      'comerciais': { 'en': 'Commercial Properties', 'es': 'Propiedades Comerciales', 'zh': '商业地产', 'pt': 'Imóveis Comerciais' },
      'tempo-integral': { 'en': 'Full Time', 'es': 'Tiempo Completo', 'zh': '全职', 'pt': 'Tempo Integral' },
      'meio-periodo': { 'en': 'Part Time', 'es': 'Medio Tiempo', 'zh': '兼职', 'pt': 'Meio Período' },
      'freelancer': { 'en': 'Freelancer', 'es': 'Freelancer', 'zh': '自由职业', 'pt': 'Freelancer' },
      'tecnologia': { 'en': 'Technology & IT', 'es': 'Tecnología y TI', 'zh': '技术与IT', 'pt': 'Tecnologia e TI' },
      'vendas': { 'en': 'Sales & Commerce', 'es': 'Ventas y Comercio', 'zh': '销售与商业', 'pt': 'Vendas e Comércio' },
      'celulares': { 'en': 'Phones & Smartphones', 'es': 'Teléfonos y Smartphones', 'zh': '手机与智能手机', 'pt': 'Celulares e Smartphones' },
      'computadores': { 'en': 'Computers & Laptops', 'es': 'Computadoras y Laptops', 'zh': '电脑与笔记本', 'pt': 'Computadores e Notebooks' },
      'tvs': { 'en': 'TVs & Home Theater', 'es': 'TVs y Home Theater', 'zh': '电视与家庭影院', 'pt': 'TVs e Home Theater' },
      'cameras': { 'en': 'Cameras & Camcorders', 'es': 'Cámaras y Filmadoras', 'zh': '相机与摄像机', 'pt': 'Câmeras e Filmadoras' },
      'games': { 'en': 'Games & Consoles', 'es': 'Juegos y Consolas', 'zh': '游戏与主机', 'pt': 'Games e Consoles' },
      'acessorios': { 'en': 'Accessories', 'es': 'Accesorios', 'zh': '配件', 'pt': 'Acessórios' },
      'acessorios-pets': { 'en': 'Pet Accessories', 'es': 'Accesorios para Mascotas', 'zh': '宠物配件', 'pt': 'Acessórios para Pets' },
      'aves': { 'en': 'Birds', 'es': 'Aves', 'zh': '鸟类', 'pt': 'Aves' },
      'beleza': { 'en': 'Beauty & Care', 'es': 'Belleza y Cuidados', 'zh': '美容护理', 'pt': 'Beleza e Cuidados' },
      'beleza-servicos': { 'en': 'Beauty & Aesthetics', 'es': 'Belleza y Estética', 'zh': '美容美学', 'pt': 'Beleza e Estética' },
      'caes': { 'en': 'Dogs', 'es': 'Perros', 'zh': '狗', 'pt': 'Cães' },
      'calcados': { 'en': 'Shoes', 'es': 'Calzado', 'zh': '鞋类', 'pt': 'Calçados' },
      'ciclismo': { 'en': 'Cycling & Running', 'es': 'Ciclismo y Carreras', 'zh': '骑行与跑步', 'pt': 'Ciclismo e Corrida' },
      'decoracao': { 'en': 'Decoration', 'es': 'Decoración', 'zh': '装饰', 'pt': 'Decoração' },
      'eletrodomesticos': { 'en': 'Home Appliances', 'es': 'Electrodomésticos', 'zh': '家用电器', 'pt': 'Eletrodomésticos' },
      'eventos': { 'en': 'Events & Parties', 'es': 'Eventos y Fiestas', 'zh': '活动与聚会', 'pt': 'Eventos e Festas' },
      'fitness': { 'en': 'Fitness & Gym', 'es': 'Fitness y Gimnasio', 'zh': '健身与健身房', 'pt': 'Fitness e Academia' },
      'futebol': { 'en': 'Football', 'es': 'Fútbol', 'zh': '足球', 'pt': 'Futebol' },
      'gatos': { 'en': 'Cats', 'es': 'Gatos', 'zh': '猫', 'pt': 'Gatos' },
      'jardim': { 'en': 'Garden & Outdoor', 'es': 'Jardín y Exterior', 'zh': '花园与户外', 'pt': 'Jardim e Exterior' },
      'limpeza': { 'en': 'Cleaning & Organization', 'es': 'Limpieza y Organización', 'zh': '清洁与整理', 'pt': 'Limpeza e Organização' },
      'moveis': { 'en': 'Furniture', 'es': 'Muebles', 'zh': '家具', 'pt': 'Móveis' },
      'natacao': { 'en': 'Swimming & Water Sports', 'es': 'Natación y Deportes Acuáticos', 'zh': '游泳与水上运动', 'pt': 'Natação e Esportes Aquáticos' },
      'reformas': { 'en': 'Renovations & Construction', 'es': 'Reformas y Construcción', 'zh': '装修与建筑', 'pt': 'Reformas e Construção' },
      'roupas-femininas': { 'en': 'Women\'s Clothing', 'es': 'Ropa Femenina', 'zh': '女装', 'pt': 'Roupas Femininas' },
      'roupas-masculinas': { 'en': 'Men\'s Clothing', 'es': 'Ropa Masculina', 'zh': '男装', 'pt': 'Roupas Masculinas' }
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
