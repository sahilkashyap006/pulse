
const { z } = require("zod");

const createMonitorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),

  url: z.string().url("Enter a valid URL"),

  method: z.enum(["GET", "HEAD", "POST"]).default("GET"),

  expectedStatus: z.number().int().min(100).max(599).default(200),

  intervalSec: z.union([
    z.literal(60),
    z.literal(300),
    z.literal(600),
  ]).default(300),
});

const updateMonitorSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),

    url: z.string().url("Enter a valid URL").optional(),

    method: z.enum(["GET", "HEAD", "POST"]).optional(),

    expectedStatus: z.number().int().min(100).max(599).optional(),

    intervalSec: z.union([
      z.literal(60),
      z.literal(300),
      z.literal(600),
    ]).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update" }
  );

module.exports = {
  createMonitorSchema,
  updateMonitorSchema,
};
