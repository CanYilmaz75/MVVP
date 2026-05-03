import { z } from "zod";

export const teamInviteSchema = z.object({
  email: z.string().email().max(254),
  fullName: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["clinician", "admin"]).default("clinician")
});

export const memberRoleSchema = z.object({
  role: z.enum(["clinician", "admin"])
});

export const enterpriseRequestSchema = z.object({
  desiredSeats: z.coerce.number().int().min(21).max(10000),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().email().max(254),
  message: z.string().trim().max(2000).optional()
});

export type TeamInviteInput = z.infer<typeof teamInviteSchema>;
export type MemberRoleInput = z.infer<typeof memberRoleSchema>;
export type EnterpriseRequestInput = z.infer<typeof enterpriseRequestSchema>;
