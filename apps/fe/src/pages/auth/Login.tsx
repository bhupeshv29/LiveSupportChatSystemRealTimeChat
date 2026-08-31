import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { login } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import { getRoleHome } from "../../types/types";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading, setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const result = await login({ email, password });
      setAuth(result.token, result.user);
      navigate(getRoleHome(result.user.role));
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Login</h1>
          <p className="text-gray-500 mt-1">Login to Support Desk</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
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
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-6 bg-black text-white rounded-lg py-2.5 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-center mt-5 text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-black font-medium underline">
            Signup
          </Link>
        </p>
      </form>
    </div>
  );
}
