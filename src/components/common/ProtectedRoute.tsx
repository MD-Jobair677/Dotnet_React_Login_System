import { Navigate } from "react-router";
import { useAppSelector } from "../../Core/Data/Redux/store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string | string[];
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const token = useAppSelector((state) => state.auth.token);
  const permissions = useAppSelector((state) => state.auth.permissions);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission) {
    const requiredPermissions = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    const hasPermission = requiredPermissions.some((permission) =>
      permissions.includes(permission)
    );

    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
