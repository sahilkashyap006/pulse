
const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters"),
});

module.exports = { registerSchema };
