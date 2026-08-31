import { useState } from "react";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  useAdminSupervisors,
  useSupervisorAgents,
} from "../../hooks/admin/useAdminSupervisors";
import { useRemoveAgentFromSupervisor } from "../../hooks/admin/useAdminMutations";

export default function AdminSupervisors() {
  const { user, logout } = useAuth();

  const [selectedSupervisorId, setSelectedSupervisorId] = useState<
    string | null
  >(null);

  const {
    data: supervisors = [],
    isLoading: supervisorsLoading,
    isError: supervisorsError,
  } = useAdminSupervisors();

  const {
    data: agents = [],
    isLoading: agentsLoading,
    isError: agentsError,
  } = useSupervisorAgents(selectedSupervisorId);

  const removeAgent = useRemoveAgentFromSupervisor();

  function handleRemove(agentId: string) {
    if (!selectedSupervisorId) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this agent from the supervisor?",
    );

    if (!confirmed) {
      return;
    }

    removeAgent.mutate({
      supervisorId: selectedSupervisorId,
      agentId,
    });
  }

  if (supervisorsLoading) {
    return <div className="p-6">Loading supervisors...</div>;
  }

  if (supervisorsError) {
    return <div className="p-6 text-red-600">Failed to load supervisors.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="ADMIN" username={user?.name ?? ""} onLogout={logout} />

      <main className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Supervisors</h1>

          <p className="text-gray-500 mt-1">
            Manage supervisors and their assigned agents.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Supervisors list */}
          <section className="bg-white border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold">Supervisors</h2>
            </div>

            {supervisors.length === 0 ? (
              <div className="p-6 text-gray-500">No supervisors found.</div>
            ) : (
              <div className="divide-y">
                {supervisors.map((supervisor) => {
                  const isSelected = selectedSupervisorId === supervisor.id;

                  return (
                    <button
                      key={supervisor.id}
                      onClick={() => setSelectedSupervisorId(supervisor.id)}
                      className={`w-full text-left px-6 py-4 transition ${
                        isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-medium">{supervisor.name}</p>

                      <p className="text-sm text-gray-500 mt-1">
                        {supervisor.email}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Selected supervisor */}
          <section className="lg:col-span-2 bg-white border rounded-xl overflow-hidden">
            {!selectedSupervisorId ? (
              <div className="h-full min-h-64 flex items-center justify-center text-gray-500">
                Select a supervisor to view their agents.
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b">
                  <h2 className="font-semibold">Assigned Agents</h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Agents currently assigned to this supervisor.
                  </p>
                </div>

                {agentsLoading ? (
                  <div className="p-6 text-gray-500">Loading agents...</div>
                ) : agentsError ? (
                  <div className="p-6 text-red-600">Failed to load agents.</div>
                ) : agents.length === 0 ? (
                  <div className="p-6 text-gray-500">
                    No agents assigned to this supervisor.
                  </div>
                ) : (
                  <div className="divide-y">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="px-6 py-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-medium">{agent.name}</p>

                          <p className="text-sm text-gray-500">{agent.email}</p>
                        </div>

                        <button
                          onClick={() => handleRemove(agent.id)}
                          disabled={removeAgent.isPending}
                          className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {removeAgent.isError && (
                  <div className="px-6 py-3 border-t bg-red-50 text-sm text-red-600">
                    Failed to remove agent.
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
