import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import type { ZodTypeAny } from "zod";

import { AppError, isAppError } from "@/lib/errors";
import { logEvent } from "@/lib/logger";

type RouteContext<TParams = Record<string, string>> = {
  request: NextRequest;
  params: TParams;
  requestId: string;
};

export function parseJsonBody<TSchema extends ZodTypeAny>(schema: TSchema, request: NextRequest) {
  return request.json().then((body) => schema.parse(body));
}

export function apiSuccess<T>(data: T, requestId: string, init?: ResponseInit) {
  return NextResponse.json(
    {
      data,
      requestId
    },
    init
  );
}

export function apiRoute<TParams = Record<string, string>>(
  handler: (context: RouteContext<TParams>) => Promise<NextResponse>
) {
  return async (request: NextRequest, routeContext: { params: Promise<TParams> }) => {
    const requestId = randomUUID();
    const params = await routeContext.params;

    try {
      const response = await handler({ request, params, requestId });
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      const appError = isAppError(error)
        ? error
        : new AppError("INTERNAL_ERROR", "Something went wrong while processing the request.", 500);

      logEvent({
        level: "error",
        message: appError.message,
        requestId,
        route: request.nextUrl.pathname,
        errorCode: appError.code,
        metadata: isAppError(error) ? error.details : undefined
      });

      return NextResponse.json(
        {
          error: {
            code: appError.code,
            message: appError.message,
            requestId
          }
        },
        { status: appError.status }
      );
    }
  };
}
