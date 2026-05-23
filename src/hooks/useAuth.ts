import { useAppSelector } from "../Core/Data/Redux/store";

export const useAuth = () => {
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const permissions = useAppSelector((state) => state.auth.permissions);

  return { token, user, permissions, isAuthenticated: !!token };
};