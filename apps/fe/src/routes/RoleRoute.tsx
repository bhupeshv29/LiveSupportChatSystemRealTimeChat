import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import type { Role } from "../types/types";

interface RoleRouteProps {
  allowedRoles: Role[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
