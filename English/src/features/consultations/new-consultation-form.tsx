"use client";

import { useState, useTransition } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const schema = z.object({
  patientReference: z.string().min(2, "Patient reference is required."),
  specialty: z.string().min(2, "Specialty is required."),
  spokenLanguage: z.string().min(2, "Language is required."),
  consultationType: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function NewConsultationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientReference: "",
      specialty: "General Medicine",
      spokenLanguage: "de",
      consultationType: ""
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        setError(payload.error?.message ?? "Consultation could not be created.");
        return;
      }

      router.push(`/consultations/${payload.data.id}` as Route);
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start Consultation</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="patientReference">
              Patient Reference
            </label>
            <Input id="patientReference" {...form.register("patientReference")} />
            <p className="text-sm text-destructive">{form.formState.errors.patientReference?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="specialty">
              Specialty
            </label>
            <Input id="specialty" {...form.register("specialty")} />
            <p className="text-sm text-destructive">{form.formState.errors.specialty?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="spokenLanguage">
              Spoken Language
            </label>
            <Input id="spokenLanguage" {...form.register("spokenLanguage")} />
            <p className="text-sm text-destructive">{form.formState.errors.spokenLanguage?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="consultationType">
              Consultation Type
            </label>
            <Input id="consultationType" {...form.register("consultationType")} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/consultations")}>
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? "Starting..." : "Start Consultation"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
