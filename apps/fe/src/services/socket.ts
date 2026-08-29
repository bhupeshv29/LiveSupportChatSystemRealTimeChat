import type { Role } from "../types";

type ServerEvent =
  | { event: "CONVERSATION_JOINED"; data: { conversationId: string } }
  | {
      event: "NEW_MESSAGE";
      data: {
        conversationId: string;
        senderId: string;
        senderRole: Role;
        content: string;
        createdAt: string;
      };
    }
  | { event: "CONVERSATION_CLOSED"; data: { conversationId: string } }
  | { event: "ERROR"; data: { message: string } };
export function connectConversation(
  conversationId: string,
  token: string,
  onEvent: (event: ServerEvent) => void,
) {
  const socket = new WebSocket(
    `${import.meta.env.VITE_WS_URL ?? "ws://localhost:8080"}?token=${encodeURIComponent(token)}`,
  );
  socket.onopen = () =>
    socket.send(
      JSON.stringify({ event: "JOIN_CONVERSATION", data: { conversationId } }),
    );
  socket.onmessage = (event) => onEvent(JSON.parse(event.data) as ServerEvent);
  return {
    send: (content: string) =>
      socket.send(
        JSON.stringify({
          event: "SEND_MESSAGE",
          data: { conversationId, content },
        }),
      ),
    closeConversation: () =>
      socket.send(
        JSON.stringify({
          event: "CLOSE_CONVERSATION",
          data: { conversationId },
        }),
      ),
    disconnect: () => {
      socket.send(
        JSON.stringify({
          event: "LEAVE_CONVERSATION",
          data: { conversationId },
        }),
      );
      socket.close();
    },
  };
}
