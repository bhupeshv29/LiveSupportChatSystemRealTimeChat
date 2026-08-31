import { useEffect, useRef } from "react";
import type { ConversationDetail, Message } from "../../types/types";
import MessageBubble from "./MessageBubble";

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  conversation: ConversationDetail;
}

function participantName(
  userId: string,
  conversation: ConversationDetail,
): string {
  if (conversation.candidate?.id === userId) {
    return conversation.candidate.name;
  }

  if (conversation.agent?.id === userId) {
    return conversation.agent.name;
  }

  return "Unknown";
}

export default function ChatWindow({
  messages,
  currentUserId,
  conversation,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages.at(-1)?.id]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      {messages.map((message) => {
        const senderName =
          message.senderName ??
          participantName(message.senderId, conversation);

        return (
          <MessageBubble
            key={message.id}
            content={message.content}
            senderName={senderName}
            isMine={message.senderId === currentUserId}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
