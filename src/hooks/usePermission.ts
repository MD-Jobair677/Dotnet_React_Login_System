import { useAppSelector } from "../Core/Data/Redux/store";

export const usePermissions = () => {
  const permissions = useAppSelector((state) => state.auth.permissions);

  const hasPermission = (permission: string | string[]): boolean => {
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];
    return requiredPermissions.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (permission: string | string[]): boolean => {
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];
    return requiredPermissions.every((p) => permissions.includes(p));
  };

  return { permissions, hasPermission, hasAllPermissions };
};