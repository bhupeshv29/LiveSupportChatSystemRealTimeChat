import Navbar from "../components/Navbar";
import AssignAgentSelect from "../components/conversation/AssignAgentSelect";
import { useAuth } from "../context/AuthContext";
import { useSupervisorConversations } from "../hooks/useSupervisorConversation";

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();

  const {
    data: conversations = [],
    isLoading,
    isError,
  } = useSupervisorConversations();

  if (isLoading) {
    return <div className="p-6">Loading conversations...</div>;
  }

  if (isError) {
    return <div className="p-6">Failed to load conversations.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="SUPERVISOR" username={user?.name ?? ""} onLogout={logout} />

      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Support queue</h1>

        {conversations.length === 0 ? (
          <p className="text-gray-500">No conversations in the queue.</p>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-4">Conversation</th>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Agent</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation.id} className="border-b last:border-0">
                    <td className="p-4 font-mono text-sm">{conversation.id}</td>
                    <td className="p-4">
                      {conversation.candidate?.name ?? "Unknown"}
                    </td>
                    <td className="p-4">{conversation.status}</td>
                    <td className="p-4">
                      {conversation.agent ? (
                        conversation.agent.name
                      ) : conversation.status === "OPEN" ? (
                        <AssignAgentSelect conversationId={conversation.id} />
                      ) : (
                        "Unassigned"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
