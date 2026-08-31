import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import { useCreateConversation } from "../../hooks/useCreateConversation";
import { useCandidateConversations } from "../../hooks/useCandidateConversations";
import { getErrorMessage } from "../../services/api";
import type { ConversationStatus } from "../../types/types";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function StatusBadge({ status }: { status: ConversationStatus }) {
  const isOpen = status === "OPEN";

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
        isOpen ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {isOpen ? "Open" : "Closed"}
    </span>
  );
}

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const createConversationMutation = useCreateConversation();
  const {
    data: conversations = [],
    isLoading,
    isError,
  } = useCandidateConversations();

  const hasOpenConversation = conversations.some(
    (conversation) => conversation.status === "OPEN",
  );

  function openChat(conversationId: string) {
    navigate(`/candidate/conversations/${conversationId}`);
  }

  function handleCreateConversation() {
    createConversationMutation.mutate(undefined, {
      onSuccess: (data) => {
        openChat(data.id);
      },
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          const conversationId = error.response.data?.conversationId;
          if (typeof conversationId === "string") {
            openChat(conversationId);
          }
        }
      },
    });
  }

  if (isLoading) {
    return <div className="p-6">Loading conversations...</div>;
  }

  if (isError) {
    return <div className="p-6">Failed to load conversations.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="CANDIDATE" username={user?.name ?? ""} onLogout={logout} />

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">My conversations</h1>
            <p className="text-gray-500 mt-1">
              History of your support chats, assigned agents, and status.
            </p>
          </div>

          <button
            onClick={handleCreateConversation}
            disabled={
              createConversationMutation.isPending || hasOpenConversation
            }
            className="px-4 py-2.5 bg-black text-white rounded-lg disabled:opacity-50"
          >
            {hasOpenConversation
              ? "Open conversation in progress"
              : createConversationMutation.isPending
                ? "Creating..."
                : "Start conversation"}
          </button>
        </div>

        {createConversationMutation.isError && !hasOpenConversation && (
          <p className="mb-4 text-sm text-red-600">
            {getErrorMessage(
              createConversationMutation.error,
              "Failed to create conversation",
            )}
          </p>
        )}

        <div className="bg-white border rounded-xl overflow-hidden">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No chat history yet. Start a conversation to get help.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Conversation</th>
                    <th className="px-4 py-3 font-medium">Assigned agent</th>
                    <th className="px-4 py-3 font-medium">Supervisor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conversation) => (
                    <tr
                      key={conversation.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {conversation.id}
                      </td>
                      <td className="px-4 py-3">
                        {conversation.agent?.name ?? "Unassigned"}
                      </td>
                      <td className="px-4 py-3">
                        {conversation.supervisor?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={conversation.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(conversation.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openChat(conversation.id)}
                          className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                        >
                          {conversation.status === "OPEN" ? "Open chat" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
