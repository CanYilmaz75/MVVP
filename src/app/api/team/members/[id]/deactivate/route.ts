import { apiRoute, apiSuccess } from "@/server/api/route";
import { deactivateMember } from "@/server/services/team-service";

export const POST = apiRoute<{ id: string }>(async ({ params, requestId }) => {
  const member = await deactivateMember(params.id);
  return apiSuccess(member, requestId);
});
