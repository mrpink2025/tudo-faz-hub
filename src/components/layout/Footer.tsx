import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();
  return (
    <footer className="border-t mt-16 bg-gradient-to-br from-background to-muted/30">
      <div className="container py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/tudofaz-logo-new.png" alt="TudoFaz" className="h-8 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            {t("footer.description")}
          </p>
          <p className="text-xs text-muted-foreground">
            Conectando pessoas e negócios em todo o Brasil
          </p>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Navegação</h3>
          <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/explorar" className="hover:text-foreground transition-colors">{t("footer.links.explore")}</Link>
            <Link to="/publicar" className="hover:text-foreground transition-colors">{t("footer.links.publish")}</Link>
            <Link to="/entrar" className="hover:text-foreground transition-colors">{t("footer.links.login")}</Link>
            <Link to="/creditos" className="hover:text-foreground transition-colors">Créditos</Link>
          </nav>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Suporte</h3>
          <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
            <a href="mailto:contato@tudofaz.com" className="hover:text-foreground transition-colors">Contato</a>
          </nav>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("footer.poweredBy")}</span>
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" aria-label="Stripe payments">
              <img src="https://cdn.simpleicons.org/stripe" alt="Stripe logo" width="64" height="24" loading="lazy" decoding="async" />
            </a>
          </div>
          <ul className="flex items-center gap-4" aria-label={t("footer.acceptedBrands")}>
            <li><img src="https://cdn.simpleicons.org/visa" alt="Visa" width="36" height="24" loading="lazy" decoding="async" /></li>
            <li><img src="https://cdn.simpleicons.org/mastercard" alt="Mastercard" width="36" height="24" loading="lazy" decoding="async" /></li>
            <li><img src="https://cdn.simpleicons.org/americanexpress" alt="American Express" width="36" height="24" loading="lazy" decoding="async" /></li>
            <li><img src="/images/payments/elo.svg" alt="Elo" width="36" height="24" loading="lazy" decoding="async" /></li>
            <li><img src="/images/payments/hipercard.svg" alt="Hipercard" width="36" height="24" loading="lazy" decoding="async" /></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-4 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>© {year} tudofaz.com — {t("footer.copyright")}</span>
          <nav className="flex items-center gap-4">
            <Link to="/termos" className="hover:text-foreground transition">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-foreground transition">Política de Privacidade</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
