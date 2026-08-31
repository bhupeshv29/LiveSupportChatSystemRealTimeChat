import type { AuthResponse, LoginRequest, SignupRequest, User } from "../types/types";
import api from "./api";

function asAuthResponse(data: unknown): AuthResponse {
  if (
    data &&
    typeof data === "object" &&
    "token" in data &&
    "user" in data &&
    typeof data.token === "string" &&
    data.user
  ) {
    return data as AuthResponse;
  }

  const message =
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
      ? data.message
      : "Authentication failed";

  throw new Error(message);
}

function asUser(data: unknown): User {
  if (
    data &&
    typeof data === "object" &&
    "id" in data &&
    "role" in data &&
    typeof data.id === "string"
  ) {
    return data as User;
  }

  const message =
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
      ? data.message
      : "Not authenticated";

  throw new Error(message);
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post("/auth/login", data);
  return asAuthResponse(response.data);
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const response = await api.post("/auth/signup", data);
  return asAuthResponse(response.data);
}

export async function getMe(): Promise<User> {
  const response = await api.get("/auth/me");
  return asUser(response.data);
}
