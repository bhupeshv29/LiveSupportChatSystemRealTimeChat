import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import type {
  ClientEvent,
  ConversationDetail,
  ServerEvent,
} from "../../types/types";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

function send(socket: WebSocket, event: ClientEvent) {
  if (socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  socket.send(JSON.stringify(event));
  return true;
}

export function useChatSocket(
  conversationId: string | undefined,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const closedRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !conversationId) {
      return;
    }

    if (!token) {
      setError("Not authenticated");
      return;
    }

    setError(null);
    closedRef.current = false;

    const socket = new WebSocket(
      `${WS_URL}?token=${encodeURIComponent(token)}`,
    );
    socketRef.current = socket;

    function patchConversation(
      updater: (conversation: ConversationDetail) => ConversationDetail,
    ) {
      queryClient.setQueryData(
        ["conversation", conversationId],
        (old: ConversationDetail | undefined) => (old ? updater(old) : old),
      );
    }

    socket.onopen = () => setIsConnected(true);

    socket.onmessage = (event) => {
      const data: ServerEvent = JSON.parse(event.data);

      if (data.type === "AUTHENTICATED") {
        send(socket, { type: "JOIN_CONVERSATION", conversationId });
        return;
      }

      if (data.type === "NEW_MESSAGE") {
        patchConversation((conversation) => {
          if (conversation.messages?.some((m) => m.id === data.message.id)) {
            return conversation;
          }

          return {
            ...conversation,
            messages: [...(conversation.messages ?? []), data.message],
          };
        });
        return;
      }

      if (data.type === "CONVERSATION_CLOSED") {
        closedRef.current = true;
        patchConversation((conversation) => ({
          ...conversation,
          status: "CLOSE",
        }));
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["agent-conversations"] });
        return;
      }

      if (data.type === "ERROR") {
        setError(data.message);
      }
    };

    socket.onerror = () => setError("WebSocket connection failed");

    socket.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
    };

    return () => {
      send(socket, { type: "LEAVE_CONVERSATION", conversationId });
      socket.close();
      socketRef.current = null;
    };
  }, [conversationId, token, queryClient, enabled]);

  function sendMessage(content: string) {
    const socket = socketRef.current;
    if (!socket || !conversationId || closedRef.current) {
      return;
    }

    send(socket, { type: "SEND_MESSAGE", conversationId, content });
  }

  function closeConversation() {
    const socket = socketRef.current;
    if (!socket || !conversationId) {
      return false;
    }

    return send(socket, { type: "CLOSE_CONVERSATION", conversationId });
  }

  return {
    isConnected,
    error,
    sendMessage,
    closeConversation,
  };
}
