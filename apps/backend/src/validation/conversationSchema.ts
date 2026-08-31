import * as z from "zod";

const AssignAgentSchema = z.object({
  agentId: z.uuid(),
});
