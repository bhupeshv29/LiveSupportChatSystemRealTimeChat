import { useState } from "react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useAdminAgents } from "../../hooks/useAdminAgents";
import { useAdminSupervisors } from "../../hooks/useAdminSupervisors";
import { useAssignAgentToSupervisor } from "../../hooks/useAdminMutations";

export default function AdminAgents() {
  const { user, logout } = useAuth();

  const {
    data: agents = [],
    isLoading: agentsLoading,
    isError: agentsError,
  } = useAdminAgents();

  const { data: supervisors = [], isLoading: supervisorsLoading } =
    useAdminSupervisors();

  const assignAgent = useAssignAgentToSupervisor();

  const [selectedSupervisor, setSelectedSupervisor] = useState<
    Record<string, string>
  >({});

  function handleAssign(agentId: string) {
    const supervisorId = selectedSupervisor[agentId];

    if (!supervisorId) {
      return;
    }

    assignAgent.mutate({
      agentId,
      supervisorId,
    });
  }

  if (agentsLoading || supervisorsLoading) {
    return <div className="p-6">Loading agents...</div>;
  }

  if (agentsError) {
    return <div className="p-6 text-red-600">Failed to load agents.</div>;
  }

  const unassignedAgents = agents.filter(
    (agent) => agent.supervisorId === null,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="ADMIN" username={user?.name ?? ""} onLogout={logout} />

      <main className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Agents</h1>

          <p className="text-gray-500 mt-1">
            Manage agents and their supervisor assignments.
          </p>
        </div>

        {/* All Agents */}
        <section className="bg-white border rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">All Agents</h2>
          </div>

          {agents.length === 0 ? (
            <div className="p-6 text-gray-500">No agents found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3">Name</th>

                    <th className="text-left px-6 py-3">Email</th>

                    <th className="text-left px-6 py-3">Supervisor</th>

                    <th className="text-left px-6 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b last:border-0">
                      <td className="px-6 py-4 font-medium">{agent.name}</td>

                      <td className="px-6 py-4 text-gray-600">{agent.email}</td>

                      <td className="px-6 py-4">
                        {agent.supervisor?.name ?? "Unassigned"}
                      </td>

                      <td className="px-6 py-4">
                        {agent.supervisor ? (
                          <span className="text-green-600">Assigned</span>
                        ) : (
                          <span className="text-orange-600">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Unassigned Agents */}
        <section className="bg-white border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Unassigned Agents</h2>

            <p className="text-sm text-gray-500 mt-1">
              Assign an agent to a supervisor.
            </p>
          </div>

          {unassignedAgents.length === 0 ? (
            <div className="p-6 text-gray-500">
              All agents are currently assigned.
            </div>
          ) : (
            <div className="divide-y">
              {unassignedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">{agent.name}</p>

                    <p className="text-sm text-gray-500">{agent.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={selectedSupervisor[agent.id] ?? ""}
                      onChange={(event) =>
                        setSelectedSupervisor((previous) => ({
                          ...previous,
                          [agent.id]: event.target.value,
                        }))
                      }
                      className="border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select supervisor</option>

                      {supervisors.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleAssign(agent.id)}
                      disabled={
                        !selectedSupervisor[agent.id] || assignAgent.isPending
                      }
                      className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
                    >
                      {assignAgent.isPending ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {assignAgent.isError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            Failed to assign agent.
          </div>
        )}
      </main>
    </div>
  );
}
