import type { Role, User } from "../types";

const SESSION_KEY = "supportdesk-user";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
type TokenResponse = { token?: string; message?: string };

async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await response.json()) as Omit<User, "token"> & {
    message?: string;
  };
  if (!response.ok || !data.role)
    throw new Error(data.message ?? "Could not load your account");
  return { ...data, token };
}
async function saveAuthenticatedUser(
  response: Promise<Response>,
): Promise<User> {
  const result = await response;
  const data = (await result.json()) as TokenResponse;
  if (!result.ok || !data.token)
    throw new Error(data.message ?? "Authentication failed");
  const user = await getCurrentUser(data.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}
export const getSession = (): User | null => {
  const saved = localStorage.getItem(SESSION_KEY);
  return saved ? (JSON.parse(saved) as User) : null;
};
export const signOut = () => localStorage.removeItem(SESSION_KEY);
export const signIn = (email: string, password: string) =>
  saveAuthenticatedUser(
    fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
export const signUp = (
  name: string,
  email: string,
  password: string,
  role: Role,
) =>
  saveAuthenticatedUser(
    fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    }),
  );
