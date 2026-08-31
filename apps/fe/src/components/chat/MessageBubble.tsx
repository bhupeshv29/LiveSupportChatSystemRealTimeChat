interface MessageBubbleProps {
  content: string;
  isMine: boolean;
  senderName: string;
}

export default function MessageBubble({
  content,
  isMine,
  senderName,
}: MessageBubbleProps) {
  return (
    <div className={`flex mb-4 ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-md rounded-xl px-4 py-3 ${
          isMine ? "bg-blue-200 text-gray-800" : "bg-gray-100"
        }`}
      >
        <p className="text-xs opacity-70 mb-1">{senderName}</p>
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
}
