import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Person } from "./services/api";
import { getSession, signIn, signOut, signUp } from "./services/auth";
import { connectConversation } from "./services/socket";
import type { Conversation, Message, Role } from "./types";

const home = (role: Role) => `/${role.toLowerCase()}`;
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";
function Layout({ children }: { children: React.ReactNode }) {
  const user = getSession();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="layout">
      <aside>
        <NavLink className="logo" to={home(user.role)}>
          Support<span>Desk</span>
        </NavLink>
        <span className="role">{user.role}</span>
        <NavLink className="nav-link" to={home(user.role)}>
          Dashboard
        </NavLink>
      </aside>
      <main>
        <header>
          <div>
            <b>{user.name}</b>
            <small>{user.email}</small>
          </div>
          <button
            className="link"
            onClick={() => {
              signOut();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </header>
        {children}
      </main>
    </div>
  );
}
function Auth({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CANDIDATE");
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const user = signup
        ? await signUp(name, email, password, role)
        : await signIn(email, password);
      navigate(home(user.role));
    } catch (error) {
      setError(errorText(error));
    }
  }
  return (
    <div className="auth">
      <form onSubmit={submit}>
        <div className="logo dark">
          Support<span>Desk</span>
        </div>
        <h1>{signup ? "Create an account" : "Welcome back"}</h1>
        <p>Sign in to your support workspace.</p>
        {error && <div className="alert">{error}</div>}
        {signup && (
          <label>
            Name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}
        <label>
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {signup && (
          <label>
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
            >
              {(["CANDIDATE", "SUPERVISOR", "AGENT", "ADMIN"] as Role[]).map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </label>
        )}
        <button className="primary">
          {signup ? "Create account" : "Sign in"}
        </button>
        <p className="switch">
          {signup ? "Already registered?" : "Need an account?"}{" "}
          <NavLink to={signup ? "/login" : "/signup"}>
            {signup ? "Sign in" : "Sign up"}
          </NavLink>
        </p>
      </form>
    </div>
  );
}
function Heading({
  label,
  title,
  text,
  action,
}: {
  label: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="heading">
      <div>
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </section>
  );
}
function Status({ status }: { status: Conversation["status"] }) {
  return (
    <span className={`badge ${status === "OPEN" ? "open" : "closed"}`}>
      {status}
    </span>
  );
}
function ConversationRows({
  items,
  action,
}: {
  items: Conversation[];
  action: (item: Conversation) => React.ReactNode;
}) {
  return (
    <section className="card table-card">
      {items.length === 0 ? (
        <p className="empty">No conversations yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Conversation</th>
              <th>Status</th>
              <th>Agent</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.candidateName}</td>
                <td>#{item.id.slice(0, 8)}</td>
                <td>
                  <Status status={item.status} />
                </td>
                <td>{item.agentName ?? "Unassigned"}</td>
                <td>{action(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
function CandidateDashboard() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const list = useQuery({
    queryKey: ["candidate-conversations"],
    queryFn: api.candidateConversations,
    refetchInterval: 5_000,
  });
  const create = useMutation({
    mutationFn: api.createConversation,
    onSuccess: (id) => {
      client.invalidateQueries({ queryKey: ["candidate-conversations"] });
      navigate(`/chat/${id}`);
    },
  });
  return (
    <Layout>
      <Heading
        label="MY SUPPORT"
        title="How can we help?"
        text="Create and track your support conversations."
        action={
          <button
            className="primary"
            disabled={create.isPending}
            onClick={() => create.mutate()}
          >
            + Create support conversation
          </button>
        }
      />
      {create.error && <div className="alert">{errorText(create.error)}</div>}
      {list.error && <div className="alert">{errorText(list.error)}</div>}
      {list.isLoading ? (
        <p>Loading conversations…</p>
      ) : (
        <ConversationRows
          items={list.data ?? []}
          action={(item) =>
            item.agentId ? (
              <button
                className="link"
                onClick={() => navigate(`/chat/${item.id}`)}
              >
                Open chat →
              </button>
            ) : (
              <span className="muted">Waiting for agent</span>
            )
          }
        />
      )}
    </Layout>
  );
}
function AgentDashboard() {
  const navigate = useNavigate();
  const list = useQuery({
    queryKey: ["agent-conversations"],
    queryFn: api.agentConversations,
    refetchInterval: 5_000,
  });
  return (
    <Layout>
      <Heading
        label="MY CONVERSATIONS"
        title="Assigned conversations"
        text="Select an open request to chat with the candidate."
      />
      {list.error && <div className="alert">{errorText(list.error)}</div>}
      {list.isLoading ? (
        <p>Loading conversations…</p>
      ) : (
        <ConversationRows
          items={list.data ?? []}
          action={(item) => (
            <button
              className="link"
              onClick={() => navigate(`/chat/${item.id}`)}
            >
              Open chat →
            </button>
          )}
        />
      )}
    </Layout>
  );
}
function SupervisorDashboard() {
  const client = useQueryClient();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const conversations = useQuery({
    queryKey: ["supervisor-conversations"],
    queryFn: api.supervisorConversations,
  });
  const agents = useQuery({
    queryKey: ["supervisor-agents"],
    queryFn: api.supervisorAgents,
  });
  const assign = useMutation({
    mutationFn: ({
      conversationId,
      agentId,
    }: {
      conversationId: string;
      agentId: string;
    }) => api.assign(conversationId, agentId),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["supervisor-conversations"] }),
  });
  return (
    <Layout>
      <Heading
        label="CONVERSATION QUEUE"
        title="Assign open conversations"
        text="Choose one of your agents for each unassigned support request."
      />
      {(conversations.error || agents.error || assign.error) && (
        <div className="alert">
          {errorText(conversations.error ?? agents.error ?? assign.error)}
        </div>
      )}
      {conversations.isLoading || agents.isLoading ? (
        <p>Loading queue…</p>
      ) : (
        <section className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Conversation</th>
                <th>Status</th>
                <th>Agent</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(conversations.data ?? []).map((item) => (
                <tr key={item.id}>
                  <td>{item.candidateName}</td>
                  <td>#{item.id.slice(0, 8)}</td>
                  <td>
                    <Status status={item.status} />
                  </td>
                  <td>
                    {item.agentName ?? (
                      <select
                        value={selected[item.id] ?? ""}
                        onChange={(event) =>
                          setSelected({
                            ...selected,
                            [item.id]: event.target.value,
                          })
                        }
                      >
                        <option value="">Select agent</option>
                        {(agents.data ?? []).map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {item.agentId ? (
                      <span className="muted">Assigned</span>
                    ) : (
                      <button
                        className="primary small"
                        disabled={!selected[item.id] || assign.isPending}
                        onClick={() =>
                          assign.mutate({
                            conversationId: item.id,
                            agentId: selected[item.id]!,
                          })
                        }
                      >
                        Assign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </Layout>
  );
}
function AdminDashboard() {
  const client = useQueryClient();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const stats = useQuery({ queryKey: ["analytics"], queryFn: api.analytics });
  const supervisors = useQuery({
    queryKey: ["supervisors"],
    queryFn: api.supervisors,
  });
  const agents = useQuery({ queryKey: ["agents"], queryFn: api.agents });
  const assign = useMutation({
    mutationFn: ({
      supervisorId,
      agentId,
    }: {
      supervisorId: string;
      agentId: string;
    }) => api.assignAgentToSupervisor(supervisorId, agentId),
    onSuccess: () => client.invalidateQueries({ queryKey: ["supervisors"] }),
  });
  return (
    <Layout>
      <Heading
        label="ADMIN"
        title="Support operations"
        text="Assign agents to supervisors and monitor workload."
      />
      {(stats.error || supervisors.error || agents.error || assign.error) && (
        <div className="alert">
          {errorText(
            stats.error ?? supervisors.error ?? agents.error ?? assign.error,
          )}
        </div>
      )}
      {stats.data && (
        <div className="metrics">
          <Metric label="Total" value={stats.data.total} />
          <Metric label="Open" value={stats.data.open} />
          <Metric label="Closed" value={stats.data.closed} />
        </div>
      )}
      <section className="card">
        <h2>Supervisor teams</h2>
        {supervisors.isLoading || agents.isLoading ? (
          <p>Loading teams…</p>
        ) : (
          <div className="teams">
            {(supervisors.data ?? []).map((supervisor) => (
              <article className="team" key={supervisor.id}>
                <div>
                  <b>{supervisor.name}</b>
                  <small>{supervisor.email}</small>
                </div>
                <p>
                  {supervisor.agents.length
                    ? supervisor.agents.map((agent) => agent.name).join(", ")
                    : "No agents assigned"}
                </p>
                <div className="assign-row">
                  <select
                    value={selected[supervisor.id] ?? ""}
                    onChange={(event) =>
                      setSelected({
                        ...selected,
                        [supervisor.id]: event.target.value,
                      })
                    }
                  >
                    <option value="">Select agent</option>
                    {(agents.data ?? []).map((agent: Person) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="primary small"
                    disabled={!selected[supervisor.id] || assign.isPending}
                    onClick={() =>
                      assign.mutate({
                        supervisorId: supervisor.id,
                        agentId: selected[supervisor.id]!,
                      })
                    }
                  >
                    Assign
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
function Chat() {
  const { id = "" } = useParams();
  const user = getSession()!;
  const navigate = useNavigate();
  const client = useQueryClient();
  const [draft, setDraft] = useState("");
  const [socketError, setSocketError] = useState("");
  const [joined, setJoined] = useState(false);
  const socket = useRef<ReturnType<typeof connectConversation> | null>(null);
  const conversation = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => api.conversation(id),
  });
  const messages = useQuery({
    queryKey: ["messages", id],
    queryFn: () => api.messages(id),
  });
  useEffect(() => {
    if (
      !user.token ||
      !conversation.data?.agentId ||
      conversation.data.status === "CLOSED"
    )
      return;
    setJoined(false);
    const connection = connectConversation(id, user.token, (event) => {
      if (event.event === "NEW_MESSAGE") {
        const message: Message = {
          id: crypto.randomUUID(),
          ...event.data,
          senderName:
            event.data.senderId === user.id
              ? user.name
              : event.data.senderRole === "CANDIDATE"
                ? conversation.data.candidateName
                : (conversation.data.agentName ?? "Support agent"),
        };
        client.setQueryData<Message[]>(["messages", id], (old) => [
          ...(old ?? []),
          message,
        ]);
      }
      if (event.event === "CONVERSATION_JOINED") setJoined(true);
      if (event.event === "CONVERSATION_CLOSED")
        client.invalidateQueries({ queryKey: ["conversation", id] });
      if (event.event === "ERROR") setSocketError(event.data.message);
    });
    socket.current = connection;
    return () => connection.disconnect();
  }, [client, conversation.data, id, user.id, user.name, user.token]);
  if (conversation.isLoading)
    return (
      <Layout>
        <p>Loading conversation…</p>
      </Layout>
    );
  if (conversation.error || !conversation.data)
    return (
      <Layout>
        <div className="alert">{errorText(conversation.error)}</div>
      </Layout>
    );
  const item = conversation.data;
  const ready = item.status === "OPEN" && Boolean(item.agentId);
  const participantName =
    user.role === "CANDIDATE"
      ? (item.agentName ?? "Support agent")
      : item.candidateName;
  return (
    <Layout>
      <section className="chat">
        <div className="chat-head">
          <button className="link" onClick={() => navigate(home(user.role))}>
            ← Back
          </button>
          <div>
            <b>Chat with {participantName}</b>
            <small>Support conversation #{item.id.slice(0, 8)}</small>
          </div>
          <Status status={item.status} />
        </div>
        {!item.agentId && (
          <div className="waiting">Waiting for an agent to be assigned.</div>
        )}
        {ready && !joined && (
          <div className="waiting">Joining the conversation…</div>
        )}
        <div className="messages">
          {messages.data?.map((message) => {
            const mine = message.senderId === user.id;
            return (
              <article
                className={mine ? "message mine" : "message"}
                key={message.id}
              >
                <small>{mine ? "You" : message.senderName}</small>
                <p>{message.content}</p>
              </article>
            );
          })}
        </div>
        {socketError && <div className="alert">{socketError}</div>}
        {ready && (
          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault();
              if (joined && draft.trim()) {
                socket.current?.send(draft.trim());
                setDraft("");
              }
            }}
          >
            <input
              disabled={!joined}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                joined ? `Message ${participantName}` : "Joining conversation…"
              }
            />
            <button className="primary" disabled={!joined}>
              Send
            </button>
            {user.role === "AGENT" && (
              <button
                type="button"
                className="danger"
                disabled={!joined}
                onClick={() => socket.current?.closeConversation()}
              >
                Close
              </button>
            )}
          </form>
        )}
      </section>
    </Layout>
  );
}
export default function App() {
  const session = getSession();
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth signup />} />
      <Route path="/candidate" element={<CandidateDashboard />} />
      <Route path="/supervisor" element={<SupervisorDashboard />} />
      <Route path="/agent" element={<AgentDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/chat/:id" element={<Chat />} />
      <Route
        path="*"
        element={
          <Navigate to={session ? home(session.role) : "/login"} replace />
        }
      />
    </Routes>
  );
}
