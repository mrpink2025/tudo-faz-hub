import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type Props = { children: ReactNode };

const ProtectedRoute = ({ children }: Props) => {
  const { session, loading } = useSupabaseAuth();
  const location = useLocation();

  if (loading) return null;

  if (!session) {
    return <Navigate to="/entrar" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
