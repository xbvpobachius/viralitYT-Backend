import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasAccess } from "@/lib/access";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const allowed = hasAccess();
    if (!allowed) {
      setIsAllowed(false);
      setCheckingAccess(false);
      navigate("/login", { replace: true });
      return;
    }
    setIsAllowed(true);
    setCheckingAccess(false);
  }, [navigate]);

  if (checkingAccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
};
