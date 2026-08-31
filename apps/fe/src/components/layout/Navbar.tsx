import { Link, useNavigate } from "react-router-dom";
import { getRoleHome, type Role } from "../../types/types";

interface NavbarProps {
  role: Role;
  username: string;
  onLogout: () => void;
}

export default function Navbar({ role, username, onLogout }: NavbarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate("/login");
  }
  return (
    <nav className="h-16 shrink-0 bg-white border-b px-6 flex items-center justify-between">
      <Link to={getRoleHome(role)} className="font-bold text-lg">
        Support Desk
      </Link>

      <div className="flex items-center gap-6">
        {role === "ADMIN" && (
          <>
            <Link
              to="/admin"
              className="text-sm text-gray-600 hover:text-black"
            >
              Dashboard
            </Link>
            <Link
              to="/admin/agents"
              className="text-sm text-gray-600 hover:text-black"
            >
              Agents
            </Link>
            <Link
              to="/admin/supervisors"
              className="text-sm text-gray-600 hover:text-black"
            >
              Supervisors
            </Link>
          </>
        )}

        {role === "CANDIDATE" && (
          <Link
            to="/candidate"
            className="text-sm text-gray-600 hover:text-black"
          >
            My Conversations
          </Link>
        )}

        {role === "AGENT" && (
          <Link to="/agent" className="text-sm text-gray-600 hover:text-black">
            Conversations
          </Link>
        )}

        {role === "SUPERVISOR" && (
          <Link
            to="/supervisor"
            className="text-sm text-gray-600 hover:text-black"
          >
            Queue
          </Link>
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{username}</span>
          <button
            onClick={handleLogout}
            className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
