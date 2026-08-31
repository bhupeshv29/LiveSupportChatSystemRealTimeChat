import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import AgentDashboard from "./pages/agent/AgentDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminSupervisors from "./pages/admin/AdminSupervisors";
import ChatPage from "./pages/Chatpage";
import { useAuth } from "./context/AuthContext";
import { getRoleHome } from "./types/types";

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRoleHome(user.role)} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={["CANDIDATE"]} />}>
          <Route path="/candidate" element={<CandidateDashboard />} />
          <Route
            path="/candidate/conversations/:conversationId"
            element={<ChatPage role="CANDIDATE" />}
          />
        </Route>

        <Route element={<RoleRoute allowedRoles={["AGENT"]} />}>
          <Route path="/agent" element={<AgentDashboard />} />
          <Route
            path="/agent/conversations/:conversationId"
            element={<ChatPage role="AGENT" />}
          />
        </Route>

        <Route element={<RoleRoute allowedRoles={["SUPERVISOR"]} />}>
          <Route path="/supervisor" element={<SupervisorDashboard />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/agents" element={<AdminAgents />} />
          <Route path="/admin/supervisors" element={<AdminSupervisors />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
