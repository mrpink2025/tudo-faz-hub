import { useTranslation } from "react-i18next";
import UsersManagement from "@/components/admin/UsersManagement";
import { SEOHead } from "@/components/seo/SEOHead";

export default function AdminUsers() {
  const { t } = useTranslation();
  
  return (
    <>
      <SEOHead 
        title={t("admin.users.manage")}
        description={t("admin.users.manage_desc")}
      />
      <UsersManagement />
    </>
  );
}
