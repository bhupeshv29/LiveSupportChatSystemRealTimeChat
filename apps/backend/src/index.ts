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

app.get("/health", (_req, res) => {
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
  async (req, res) => {
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
  async (req, res) => {
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
app.post("/conversation/:id/assign");

//close conversatio using ws

// admin only
app.get("/admin/analytics");

app.listen(PORT, () => {
  console.log(`server is running ${PORT}`);
});
