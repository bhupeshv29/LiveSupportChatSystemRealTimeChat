import type {
  AdminAnalytics,
  AdminAgent,
  AdminSupervisor,
} from "../types/types";
import api from "./api";

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const response = await api.get<AdminAnalytics>("/admin/analytics");

  return response.data;
}
//agent

export async function getAdminAgents(): Promise<AdminAgent[]> {
  const response = await api.get<{ agents: AdminAgent[] }>("/admin/agents");

  return response.data.agents;
}

// -------------------------
// Supervisors
// -------------------------

export async function getAdminSupervisors(): Promise<AdminSupervisor[]> {
  const response = await api.get<{ supervisors: AdminSupervisor[] }>(
    "/admin/supervisors",
  );

  return response.data.supervisors;
}

export async function getSupervisorAgents(
  supervisorId: string,
): Promise<AdminAgent[]> {
  const response = await api.get<{ agents: AdminAgent[] }>(
    `/admin/supervisors/${supervisorId}/agents`,
  );

  return response.data.agents;
}

// -------------------------
// Assignment
// -------------------------

export async function assignAgentToSupervisor(
  supervisorId: string,
  agentId: string,
) {
  const response = await api.post(
    `/admin/supervisors/${supervisorId}/agents/${agentId}`,
  );

  return response.data;
}

// -------------------------
// Remove assignment
// -------------------------

export async function removeAgentFromSupervisor(
  supervisorId: string,
  agentId: string,
) {
  const response = await api.delete(
    `/admin/supervisors/${supervisorId}/agents/${agentId}`,
  );

  return response.data;
}
