import { useNavigate } from "react-router-dom";
import type { ConversationStatus } from "../../types/types";

interface ConversationCardProps {
  id: string;
  status: ConversationStatus;
  subtitle?: string;
  chatPath: string;
}

export default function ConversationCard({
  id,
  status,
  subtitle,
  chatPath,
}: ConversationCardProps) {
  const navigate = useNavigate();

  return (
    <div className="border rounded-xl p-5 bg-white">
      <div className="flex justify-between items-center gap-4">
        <div>
          <p className="font-semibold">Conversation</p>
          <p className="text-sm text-gray-500 font-mono mt-1">{id}</p>
          <p className="text-sm text-gray-500">Status: {status}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>

        {status === "OPEN" ? (
          <button
            onClick={() => navigate(chatPath)}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Open Chat
          </button>
        ) : (
          <button
            onClick={() => navigate(chatPath)}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
}
