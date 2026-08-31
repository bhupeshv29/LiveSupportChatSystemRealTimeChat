import { type ChangeEvent } from "react";
import { useAssignConversationAgent } from "../../hooks/useAssignConversationAgent";
import { useSupervisorTeamAgents } from "../../hooks/useSupervisorTeamAgents";
import { getErrorMessage } from "../../services/api";

interface AssignAgentSelectProps {
  conversationId: string;
}

export default function AssignAgentSelect({
  conversationId,
}: AssignAgentSelectProps) {
  const { data: agents = [], isLoading, isError } = useSupervisorTeamAgents();
  const assignAgent = useAssignConversationAgent();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const agentId = event.target.value;
    if (!agentId) return;

    assignAgent.mutate({ conversationId, agentId });
  }

  if (isLoading) {
    return <span className="text-sm text-gray-500">Loading...</span>;
  }

  if (isError) {
    return <span className="text-sm text-red-600">Failed to load agents</span>;
  }

  if (agents.length === 0) {
    return <span className="text-sm text-gray-500">No agents on your team</span>;
  }

  return (
    <div>
      <select
        defaultValue=""
        onChange={handleChange}
        disabled={assignAgent.isPending}
        className="border rounded-lg px-3 py-2 text-sm"
      >
        <option value="" disabled>
          Select agent
        </option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
      {assignAgent.isError && (
        <p className="text-xs text-red-600 mt-1">
          {getErrorMessage(assignAgent.error, "Assign failed")}
        </p>
      )}
    </div>
  );
}
