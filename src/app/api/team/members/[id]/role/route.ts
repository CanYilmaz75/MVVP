import { memberRoleSchema } from "@/schemas/team";
import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { updateMemberRole } from "@/server/services/team-service";

export const POST = apiRoute<{ id: string }>(async ({ request, params, requestId }) => {
  const body = await parseJsonBody(memberRoleSchema, request);
  const member = await updateMemberRole(params.id, body);
  return apiSuccess(member, requestId);
});
