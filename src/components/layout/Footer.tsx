import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();
  return (
    <footer className="border-t mt-10">
      <div className="container py-8 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-semibold">tudofaz.com</h2>
          <p className="text-sm text-muted-foreground">
            {t("footer.description")}
          </p>
        </div>
        <nav className="flex items-center gap-4 md:justify-end text-sm text-muted-foreground">
          <Link to="/explorar" className="hover:text-foreground transition">{t("footer.links.explore")}</Link>
          <Link to="/publicar" className="hover:text-foreground transition">{t("footer.links.publish")}</Link>
          <Link to="/entrar" className="hover:text-foreground transition">{t("footer.links.login")}</Link>
        </nav>
      </div>
      <div className="border-t">
        <div className="container py-4 text-xs text-muted-foreground">
          © {year} tudofaz.com — {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
