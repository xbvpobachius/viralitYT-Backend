import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Simplificado: No hay autenticación de usuario en el backend
// Solo OAuth de YouTube para conectar cuentas
// Permitir acceso directo
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  return <>{children}</>;
};
