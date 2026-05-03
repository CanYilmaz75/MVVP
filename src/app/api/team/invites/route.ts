import { teamInviteSchema } from "@/schemas/team";
import { apiRoute, apiSuccess, parseJsonBody } from "@/server/api/route";
import { createTeamInvite } from "@/server/services/team-service";

export const POST = apiRoute(async ({ request, requestId }) => {
  const body = await parseJsonBody(teamInviteSchema, request);
  const result = await createTeamInvite(body, request.nextUrl.origin);
  return apiSuccess(result, requestId, { status: 201 });
});
