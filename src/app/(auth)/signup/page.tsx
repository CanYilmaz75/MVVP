import { Suspense } from "react";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <Suspense>
        <SignupForm />
      </Suspense>
    </main>
  );
}
