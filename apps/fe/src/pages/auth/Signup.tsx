import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { signup } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import { getRoleHome, type Role } from "../../types/types";

const roles: Role[] = ["CANDIDATE", "AGENT", "SUPERVISOR", "ADMIN"];

export default function Signup() {
  const navigate = useNavigate();
  const { user, loading, setAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CANDIDATE");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await signup({ name, email, password, role });
      setAuth(result.token, result.user);
      navigate(getRoleHome(result.user.role));
    } catch (err) {
      setError(getErrorMessage(err, "Signup failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white border rounded-2xl p-8 shadow-sm"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-gray-500 mt-1">Join Support Desk</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="John Doe"
              required
              className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              className="w-full border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-black"
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-6 bg-black text-white rounded-lg py-2.5 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-center mt-5 text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-black hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
