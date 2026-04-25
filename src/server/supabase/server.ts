import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

import { clientEnv } from "@/lib/env/client";
import type { Database } from "@/types/database";

function isReadOnlyCookieStoreError(error: unknown) {
  return error instanceof Error && error.message.includes("Cookies can only be modified");
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  type CookieMutation = {
    name: string;
    value: string;
    options: CookieOptions;
  };

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieMutation[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              if (!isReadOnlyCookieStoreError(error)) {
                throw error;
              }
            }
          });
        }
      }
    }
  ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}
