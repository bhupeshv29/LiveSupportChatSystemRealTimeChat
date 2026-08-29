export type Role = "CANDIDATE" | "SUPERVISOR" | "AGENT" | "ADMIN";
export type Status = "OPEN" | "CLOSED";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  token?: string;
};
export type Conversation = {
  id: string;
  candidateId: string;
  candidateName: string;
  supervisorId?: string;
  agentId?: string;
  agentName?: string;
  subject: string;
  status: Status;
  createdAt: string;
};
export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  content: string;
  createdAt: string;
};
export type Agent = { id: string; name: string };
export type Analytics = {
  total: number;
  open: number;
  closed: number;
  supervisors: { name: string; agents: number; conversations: number }[];
};
