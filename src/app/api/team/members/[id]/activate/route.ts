import { apiRoute, apiSuccess } from "@/server/api/route";
import { activateMember } from "@/server/services/team-service";

export const POST = apiRoute<{ id: string }>(async ({ params, requestId }) => {
  const member = await activateMember(params.id);
  return apiSuccess(member, requestId);
});
