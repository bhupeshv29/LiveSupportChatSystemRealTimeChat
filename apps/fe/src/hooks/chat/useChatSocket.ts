import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import type {
  ClientEvent,
  ConversationDetail,
  ServerEvent,
} from "../../types/types";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

export function useChatSocket(
  conversationId: string | undefined,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const joinedRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !conversationId || !token) {
      if (!token && conversationId && enabled) {
        setError("Not authenticated");
      }
      return;
    }

    setError(null);
    setIsClosed(false);
    joinedRef.current = false;

    const socket = new WebSocket(
      `${WS_URL}?token=${encodeURIComponent(token)}`,
    );

    socketRef.current = socket;

    function join() {
      if (
        joinedRef.current ||
        socket.readyState !== WebSocket.OPEN ||
        !conversationId
      ) {
        return;
      }

      joinedRef.current = true;

      const event: ClientEvent = {
        type: "JOIN_CONVERSATION",
        conversationId,
      };

      socket.send(JSON.stringify(event));
    }

    function markClosed() {
      setIsClosed(true);
      queryClient.setQueryData(
        ["conversation", conversationId],
        (oldConversation: ConversationDetail | undefined) => {
          if (!oldConversation) {
            return oldConversation;
          }

          return {
            ...oldConversation,
            status: "CLOSE" as const,
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["agent-conversations"] });
    }

    socket.onopen = () => {
      setIsConnected(true);
      join();
    };

    socket.onmessage = (event) => {
      const data: ServerEvent = JSON.parse(event.data);

      switch (data.type) {
        case "AUTHENTICATED":
          join();
          break;

        case "JOINED_CONVERSATION":
          setError(null);
          break;

        case "NEW_MESSAGE":
          queryClient.setQueryData(
            ["conversation", conversationId],
            (oldConversation: ConversationDetail | undefined) => {
              if (!oldConversation) {
                return oldConversation;
              }

              const exists = oldConversation.messages?.some(
                (message) => message.id === data.message.id,
              );

              if (exists) {
                return oldConversation;
              }

              return {
                ...oldConversation,
                messages: [...(oldConversation.messages ?? []), data.message],
              };
            },
          );
          break;

        case "CONVERSATION_CLOSED":
          markClosed();
          break;

        case "ERROR":
          setError(data.message);
          break;

        default:
          break;
      }
    };

    socket.onerror = () => {
      setError("WebSocket connection failed");
    };

    socket.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        const leave: ClientEvent = {
          type: "LEAVE_CONVERSATION",
          conversationId,
        };

        socket.send(JSON.stringify(leave));
      }

      socket.close();
      socketRef.current = null;
    };
  }, [conversationId, token, queryClient, enabled]);

  function sendMessage(content: string) {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN || isClosed) {
      return;
    }

    const event: ClientEvent = {
      type: "SEND_MESSAGE",
      conversationId: conversationId!,
      content,
    };

    socket.send(JSON.stringify(event));
  }

  function closeConversation() {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    const event: ClientEvent = {
      type: "CLOSE_CONVERSATION",
      conversationId: conversationId!,
    };

    socket.send(JSON.stringify(event));
    return true;
  }

  return {
    isConnected,
    isClosed,
    error,
    sendMessage,
    closeConversation,
  };
}
