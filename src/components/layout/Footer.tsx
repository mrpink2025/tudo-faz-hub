/**
 * ============================================================================
 * 🦶 TUDOFAZ HUB - FOOTER COMPONENT  
 * ============================================================================
 * 
 * Site footer with links, social media, and legal information
 * Responsive design with multi-language support
 * 
 * @author by_arturalves
 * @component Footer
 * @version 1.0.0  
 * @year 2025
 * 
 * Features:
 * - 🔗 Legal and informational links
 * - 📧 Contact information
 * - 🌐 Multi-language footer content
 * - 📱 Responsive layout
 * - ♿ Accessibility compliant
 * 
 * ============================================================================
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "@/components/ui/translated-text";

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();
  return (
    <footer className="border-t mt-10">
      <div className="container py-8 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-semibold">tudofaz.com</h2>
          <p className="text-sm text-muted-foreground">
            <TranslatedText text={t("footer.description")} />
          </p>
        </div>
        <nav className="flex items-center gap-4 md:justify-end text-sm text-muted-foreground" role="navigation" aria-label="Footer navigation">
          <Link 
            to="/explorar" 
            className="hover:text-foreground focus:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-0.5"
            aria-label={t("footer.links.explore")}
          >
            {t("footer.links.explore")}
          </Link>
          <Link 
            to="/publicar" 
            className="hover:text-foreground focus:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-0.5"
            aria-label={t("footer.links.publish")}
          >
            {t("footer.links.publish")}
          </Link>
          <Link 
            to="/entrar" 
            className="hover:text-foreground focus:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-0.5"
            aria-label={t("footer.links.login")}
          >
            {t("footer.links.login")}
          </Link>
        </nav>
      </div>
      <div className="border-t">
        <div className="container py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("footer.poweredBy")}</span>
            <a 
              href="https://stripe.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Stripe payments - opens in new tab"
              className="hover:opacity-80 focus:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
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
          <nav className="flex items-center gap-4" role="navigation" aria-label="Legal navigation">
            <Link 
              to="/termos" 
              className="hover:text-foreground focus:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-0.5"
              aria-label="Termos de Uso"
            >
              Termos de Uso
            </Link>
            <Link 
              to="/privacidade" 
              className="hover:text-foreground focus:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-1 py-0.5"
              aria-label="Política de Privacidade"
            >
              Política de Privacidade
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
