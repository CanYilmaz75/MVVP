import { apiRoute, apiSuccess } from "@/server/api/route";
import { getAsyncJob } from "@/server/services/job-service";
import { processAsyncJob } from "@/server/services/async-job-processor";

export const GET = apiRoute<{ id: string }>(async ({ params, requestId }) => {
  const job = await getAsyncJob(params.id);

  if (job.status === "queued") {
    const processed = await processAsyncJob(params.id);
    return apiSuccess({ job: processed }, requestId);
  }

  return apiSuccess({ job }, requestId);
});
