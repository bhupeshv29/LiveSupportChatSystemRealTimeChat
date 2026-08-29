import * as z from "zod";

export const SignupSchema = z.object({
  name: z.string().min(1, "Atleast 1 character or more needed"),
  email: z.email(),
  password: z.string().min(8, "Atleast 8 character password needed"),
  role: z.enum(["CANDIDATE", "AGENT", "SUPERVISOR", "ADMIN"]),
});

export const loginSchema = SignupSchema.pick({
  email: true,
  password: true,
});
