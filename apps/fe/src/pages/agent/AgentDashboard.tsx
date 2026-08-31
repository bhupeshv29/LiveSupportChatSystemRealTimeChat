import ConversationCard from "../../components/conversation/ConversationCard";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useAgentConversations } from "../../hooks/agent/useAgentConversations";

export default function AgentDashboard() {
  const { user, logout } = useAuth();

  const {
    data: conversations = [],
    isLoading,
    isError,
  } = useAgentConversations();

  if (isLoading) {
    return <div className="p-6">Loading conversations...</div>;
  }

  if (isError) {
    return <div className="p-6">Failed to load conversations.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="AGENT" username={user?.name ?? ""} onLogout={logout} />

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">My Conversations</h1>

        {conversations.length === 0 ? (
          <p className="text-gray-500">No open conversations assigned yet.</p>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                id={conversation.id}
                status={conversation.status}
                subtitle={`Candidate: ${conversation.candidate?.name ?? "Unknown"}`}
                chatPath={`/agent/conversations/${conversation.id}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
