import { Suspense } from "react";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(194,160,108,0.18),_transparent_45%),linear-gradient(180deg,_rgba(247,243,236,1),_rgba(241,235,226,0.84))]" />
      <Suspense>
        <SignupForm />
      </Suspense>
    </main>
  );
}
