import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type Props = { children: ReactNode };

const AdminRoute = ({ children }: Props) => {
  const { session, loading } = useSupabaseAuth();
  const { isAdmin, loading: loadingRole } = useIsAdmin();
  const location = useLocation();

  if (loading || loadingRole) return null;
  if (!session) return <Navigate to="/entrar" state={{ from: location.pathname }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default AdminRoute;
