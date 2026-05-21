import { Navigate } from "react-router";
import { useAppSelector } from "../../Core/Data/Redux/store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAppSelector((state: { auth: { token: string | null } }) => state.auth.token);
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
