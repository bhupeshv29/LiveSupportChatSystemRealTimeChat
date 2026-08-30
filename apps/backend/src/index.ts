import express, { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { prisma, ConversationStatus, Role } from "@repo/db/client";
import { loginSchema, SignupSchema } from "./validation/authSchema";
import jwt from "jsonwebtoken";
import "dotenv/config";
import AuthMiddleware, { RequiredRole } from "./middleware/auth.middleware";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;

app.get("/health", (_req: Request, res: Response) => {
  res.json("ok");
});

//authentication
app.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const parsedData = SignupSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.json({
        message: "invalid data",
      });
    }
    const { name, email, password, role } = parsedData.data;

    //checking existing email if(true) return
    //hash password
    // save in db
    // return

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.json("user already exist ");
    }

    const hashedPassword = await bcrypt.hash(password, 4);

    const users = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role,
      },
    });

    const token = jwt.sign(
      { userId: users.id, userRole: users.role },
      JWT_SECRET as string,
    );

    res.json({
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.json("something went wrong");
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.json({
        message: "invalid input data",
      });
    }

    const { email, password } = parsedData.data;

    const users = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    const isPasswordCorrect = await bcrypt.compare(
      password,
      users?.password_hash as string,
    );

    if (!isPasswordCorrect) {
      return res.json({ message: "invalid input data" });
    }

    const token = jwt.sign(
      { userId: users?.id, userRole: users?.role },
      JWT_SECRET as string,
    );

    res.json({
      token,
      user: {
        id: users?.id,
        Role: users?.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.json("something went wrong");
  }
});

app.get("/auth/me", AuthMiddleware, async (req: Request, res: Response) => {
  const userId = req.userId;

  const users = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!users) {
    return res.json({ message: "server errror" });
  }

  return res.json({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
  });
});

//conversation
//candidate only
app.post(
  "/conversation",
  AuthMiddleware,
  RequiredRole("CANDIDATE"),
  async (req: Request, res: Response) => {
    try {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          candidateId: req.userId,
          status: ConversationStatus.OPEN,
        },
      });

      if (existingConversation) {
        return res.status(409).json({
          message: "one already open conversation",
          conversationId: existingConversation.id,
        });
      }

      const conversations = await prisma.conversation.create({
        data: {
          candidateId: req.userId,
        },
      });

      return res.json({
        conversationId: conversations.id,
        candidateId: conversations.candidateId,
        status: conversations.status,
      });
    } catch (error) {
      console.error(error);

      return res.status(409).json({
        message: "One conversation is already open",
      });
    }
  },
);

//getting a conversation
app.get(
  "/conversation/:id",
  AuthMiddleware,
  RequiredRole(Role.ADMIN, Role.AGENT, Role.CANDIDATE, Role.SUPERVISOR),
  async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const isAdmin = req.role === Role.ADMIN;

      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          ...(isAdmin
            ? {}
            : {
                OR: [
                  { candidateId: req.userId },
                  { agentId: req.userId },
                  { supervisorId: req.userId },
                ],
              }),
        },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
            },
          },
          supervisor: {
            select: {
              id: true,
              name: true,
            },
          },
          message: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              senderId: true,
              content: true,
              createdAt: true,
            },
          },
        },
      });

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found",
        });
      }

      return res.status(200).json({
        id: conversation.id,
        status: conversation.status,
        candidate: conversation.candidate,
        agent: conversation.agent,
        supervisor: conversation.supervisor,
        messages: conversation.message,
      });
    } catch (error) {
      console.error("Get conversation error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

//supervisor only
app.post(
  "/conversation/:id/assign",
  AuthMiddleware,
  RequiredRole(Role.SUPERVISOR),
  async (req, res) => {
    try {
      const supervisorId = req.userId;
      const conversationId = req.params.id;
      const { agentId } = req.body;

      // 1. Validate request
      if (!agentId) {
        return res.status(400).json({
          message: "agentId is required",
        });
      }

      const agent = await prisma.user.findFirst({
        where: {
          id: agentId,
          role: Role.AGENT,
          supervisorId,
        },
        select: {
          id: true,
        },
      });

      if (!agent) {
        return res.status(403).json({
          message: "Agent does not belong to this supervisor",
        });
      }

      // 3. Atomically claim conversation + assign agent
      const result = await prisma.conversation.updateMany({
        where: {
          id: conversationId as string,
          status: "OPEN",
          supervisorId: null,
          agentId: null,
        },
        data: {
          supervisorId,
          agentId,
          supervisorAssignedAt: new Date(),
          agentAssignedAt: new Date(),
        },
      });

      // 4. Nobody else was able to claim it (it result.count==1 then someone already updated it )
      if (result.count === 0) {
        return res.status(409).json({
          message: "Conversation is already assigned",
        });
      }

      // 5. Return updated conversation
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId as string,
        },
        select: {
          id: true,
          candidateId: true,
          supervisorId: true,
          agentId: true,
          status: true,
          supervisorAssignedAt: true,
          agentAssignedAt: true,
        },
      });

      return res.status(200).json(conversation);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

//Supervisor sees open/closed conversations

app.get(
  "/supervisor/conversations",
  AuthMiddleware,
  RequiredRole(Role.SUPERVISOR),
  async (req, res) => {
    try {
      const supervisorId = req.userId;

      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            // New requests waiting for a supervisor
            {
              status: ConversationStatus.OPEN,
              supervisorId: null,
            },

            // Conversations already assigned to this supervisor
            {
              supervisorId,
            },
          ],
        },

        include: {
          candidate: {
            select: {
              id: true,
              name: true,
            },
          },

          agent: {
            select: {
              id: true,
              name: true,
            },
          },

          supervisor: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json({
        conversations,
      });
    } catch (error) {
      console.error("Supervisor conversations error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

//agents sees open/closed conversations

app.get(
  "/agent/conversations",
  AuthMiddleware,
  RequiredRole(Role.AGENT),
  async (req, res) => {
    try {
      const agentId = req.userId;

      const conversations = await prisma.conversation.findMany({
        where: {
          agentId,
          status: ConversationStatus.OPEN,
        },

        include: {
          candidate: {
            select: {
              id: true,
              name: true,
            },
          },

          supervisor: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          updatedAt: "desc",
        },
      });

      return res.status(200).json({
        conversations,
      });
    } catch (error) {
      console.error("Agent conversations error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

//close conversation using ws

//admin gets all the agents
app.get(
  "/admin/agents",
  AuthMiddleware,
  RequiredRole(Role.ADMIN),
  async (req, res) => {
    try {
      const agents = await prisma.user.findMany({
        where: {
          role: Role.AGENT,
        },
        select: {
          id: true,
          name: true,
          email: true,
          supervisorId: true,
          supervisor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return res.status(200).json({
        agents,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

// admin gets all the supervisor
app.get(
  "admin/supervisors",
  AuthMiddleware,
  RequiredRole(Role.ADMIN),
  async (req, res) => {
    try {
      const supervisors = await prisma.user.findMany({
        where: {
          role: Role.AGENT,
        },
        select: {
          id: true,
          name: true,
          email: true,
          supervisorId: true,
          supervisor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      if (!supervisors) {
        return res.json("no supervisor is available");
      }

      res.json({ supervisors });
    } catch (error) {
      res.json("someting went wrong");
    }
  },
);

// assignment of agent to 1 supervisor (1-1 relation)
app.post(
  "/admin/supervisors/:supervisorId/agents/:agentId",
  AuthMiddleware,
  RequiredRole(Role.ADMIN),
  async (req, res) => {
    try {
      const supervisorId = req.params.supervisorId as string;
      const agentId = req.params.agentId as string;

      // Check supervisor
      const supervisor = await prisma.user.findUnique({
        where: {
          id: supervisorId,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!supervisor) {
        return res.status(404).json({
          message: "Supervisor not found",
        });
      }

      if (supervisor.role !== Role.SUPERVISOR) {
        return res.status(400).json({
          message: "User is not a supervisor",
        });
      }

      // Atomically assign the agent only if
      // the agent currently has no supervisor.
      const result = await prisma.user.updateMany({
        where: {
          id: agentId,
          role: Role.AGENT,
          supervisorId: null,
        },
        data: {
          supervisorId,
        },
      });

      if (result.count === 0) {
        // Determine whether agent exists
        const agent = await prisma.user.findUnique({
          where: {
            id: agentId,
          },
          select: {
            id: true,
            role: true,
            supervisorId: true,
          },
        });

        if (!agent) {
          return res.status(404).json({
            message: "Agent not found",
          });
        }

        if (agent.role !== Role.AGENT) {
          return res.status(400).json({
            message: "User is not an agent",
          });
        }

        return res.status(409).json({
          message: "Agent is already assigned to a supervisor",
          supervisorId: agent.supervisorId,
        });
      }

      // Return updated agent
      const agent = await prisma.user.findUnique({
        where: {
          id: agentId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          supervisorId: true,
        },
      });

      return res.status(200).json({
        message: "Agent assigned successfully",
        agent,
      });
    } catch (error) {
      console.error("Assign agent error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

// get all assigned agents of 1 supervisor
app.get(
  "/admin/supervisors/:supervisorId/agents",
  AuthMiddleware,
  RequiredRole(Role.ADMIN),
  async (req, res) => {
    try {
      const { supervisorId } = req.params;

      const supervisor = await prisma.user.findUnique({
        where: {
          id: supervisorId,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!supervisor) {
        return res.status(404).json({
          message: "Supervisor not found",
        });
      }

      if (supervisor.role !== Role.SUPERVISOR) {
        return res.status(400).json({
          message: "User is not a supervisor",
        });
      }

      const agents = await prisma.user.findMany({
        where: {
          role: Role.AGENT,
          supervisorId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          supervisorId: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return res.status(200).json({
        agents,
      });
    } catch (error) {
      console.error("Get supervisor agents error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

// Get all unassigned agents
app.get(
  "/admin/agents/unassigned",
  AuthMiddleware,
  RequiredRole(Role.ADMIN),
  async (req, res) => {
    try {
      const agents = await prisma.user.findMany({
        where: {
          role: Role.AGENT,
          supervisorId: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return res.status(200).json({
        agents,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

//Remove agent from supervisor
app.delete(
  "/admin/supervisors/:supervisorId/agents/:agentId",
  AuthMiddleware,
  RequiredRole(Role.ADMIN),
  async (req, res) => {
    try {
      const { supervisorId, agentId } = req.params;

      const result = await prisma.user.updateMany({
        where: {
          id: agentId as string,
          role: Role.AGENT,
          supervisorId,
        },
        data: {
          supervisorId: null,
        },
      });

      if (result.count === 0) {
        return res.status(404).json({
          message: "Agent is not assigned to this supervisor",
        });
      }

      return res.status(200).json({
        message: "Agent removed from supervisor successfully",
      });
    } catch (error) {
      console.error("Remove agent error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

// admin only
app.get(
  "/admin/analytics",
  AuthMiddleware,
  RequiredRole(Role.ADMIN),
  async (req: Request, res: Response) => {
    try {
      const [
        totalConversations,
        openConversations,
        closedConversations,
        supervisors,
      ] = await Promise.all([
        // Total conversations
        prisma.conversation.count(),

        // Open conversations
        prisma.conversation.count({
          where: {
            status: ConversationStatus.OPEN,
          },
        }),

        // Closed conversations
        prisma.conversation.count({
          where: {
            status: ConversationStatus.CLOSE,
          },
        }),

        // Supervisor analytics
        prisma.user.findMany({
          where: {
            role: Role.SUPERVISOR,
          },
          select: {
            id: true,
            name: true,

            // All agents belonging to this supervisor
            agents: {
              select: {
                id: true,
              },
            },

            // Conversations assigned to this supervisor
            supervisorConversations: {
              select: {
                id: true,
              },
            },
          },
        }),
      ]);

      return res.status(200).json({
        totalConversations,
        openConversations,
        closedConversations,

        supervisors: supervisors.map((supervisor) => ({
          id: supervisor.id,
          name: supervisor.name,

          // Number of agents assigned to supervisor
          agentCount: supervisor.agents.length,

          // Number of conversations assigned to supervisor
          conversationCount: supervisor.supervisorConversations.length,
        })),
      });
    } catch (error) {
      console.error("Admin analytics error:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

app.listen(PORT, () => {
  console.log(`server is running ${PORT}`);
});
