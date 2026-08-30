import type { AuthenticatedSocket } from "../types/ws.types";

export const rooms: Record<string, AuthenticatedSocket[]> = {};
