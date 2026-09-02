import { useParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import ChatWindow from "../../components/chat/ChatWindow";
import ChatInput from "../../components/chat/ChatInput";
import { useAuth } from "../../context/AuthContext";
import { useConversation } from "../../hooks/chat/useConversation";
import { useChatSocket } from "../../hooks/chat/useChatSocket";
import { closeConversation as closeConversationRequest } from "../../services/conversation.service";
import { getErrorMessage } from "../../services/api";
import type { Role } from "../../types/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface ChatPageProps {
  role: Extract<Role, "CANDIDATE" | "AGENT">;
}

export default function ChatPage({ role }: ChatPageProps) {
  const { conversationId } = useParams();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const {
    data: conversation,
    isLoading,
    isError,
  } = useConversation(conversationId);

  const isOpen = conversation?.status === "OPEN";

  const {
    isConnected,
    error: socketError,
    sendMessage,
    closeConversation,
  } = useChatSocket(conversationId, Boolean(conversationId) && isOpen);

  const conversationClosed = conversation?.status === "CLOSE";
  const canChat =
    !conversationClosed && Boolean(conversation?.agent) && isConnected;
  const canClose = role === "AGENT" && !conversationClosed;

  async function handleCloseChat() {
    if (!conversationId || closing) {
      return;
    }

    setCloseError(null);
    setClosing(true);

    try {
      await closeConversationRequest(conversationId);

      queryClient.setQueryData(
        ["conversation", conversationId],
        conversation
          ? { ...conversation, status: "CLOSE" as const }
          : conversation,
      );
      queryClient.invalidateQueries({ queryKey: ["agent-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversations", "candidate"] });

      closeConversation();
    } catch (error) {
      setCloseError(getErrorMessage(error, "Failed to close conversation"));
    } finally {
      setClosing(false);
    }
  }

  if (!conversationId) {
    return <div className="p-6">Conversation not found.</div>;
  }

  if (isLoading) {
    return <div className="p-6">Loading conversation...</div>;
  }

  if (isError || !conversation) {
    return <div className="p-6">Failed to load conversation.</div>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <Navbar role={role} username={user?.name ?? ""} onLogout={logout} />

      <main className="flex-1 min-h-0 max-w-4xl w-full mx-auto flex flex-col bg-white border-x">
        <div className="border-b px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-semibold">Support Conversation</h2>
            <p className="text-sm text-gray-500 mt-1">
              Candidate: {conversation.candidate?.name ?? "Unknown"}
              {" · "}
              Agent: {conversation.agent?.name ?? "Unassigned"}
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            {conversationClosed
              ? "Closed"
              : isConnected
                ? "Connected"
                : "Connecting..."}

            {canClose && (
              <button
                type="button"
                onClick={handleCloseChat}
                disabled={closing}
                className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50"
              >
                {closing ? "Closing..." : "Close chat"}
              </button>
            )}
          </div>
        </div>

        {!conversation.agent && !conversationClosed && (
          <div className="px-6 py-2 text-sm text-amber-700 bg-amber-50 border-b">
            Waiting for a supervisor to assign an agent. Chat unlocks after
            assignment.
          </div>
        )}

        {socketError && (
          <div className="px-6 py-2 text-sm text-red-600 bg-red-50 border-b">
            {socketError}
          </div>
        )}

        {closeError && (
          <div className="px-6 py-2 text-sm text-red-600 bg-red-50 border-b">
            {closeError}
          </div>
        )}

        <ChatWindow
          messages={conversation.messages ?? []}
          currentUserId={user?.id ?? ""}
          conversation={conversation}
        />

        <ChatInput onSend={sendMessage} disabled={!canChat} />

        {conversationClosed && (
          <div className="border-t px-6 py-3 text-sm text-gray-500 bg-gray-50 shrink-0">
            This conversation has been closed.
          </div>
        )}
      </main>
    </div>
  );
}
