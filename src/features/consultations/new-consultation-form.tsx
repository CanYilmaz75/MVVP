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
import { LANGUAGE_DETECT_VALUE } from "@/lib/language-settings";

const schema = z.object({
  patientReference: z.string().min(2, "Patientenreferenz ist erforderlich."),
  specialty: z.string().min(2, "Fachbereich ist erforderlich."),
  spokenLanguage: z.string().min(2, "Sprache ist erforderlich."),
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
      specialty: "Allgemeinmedizin",
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

        setError(payload.error?.message ?? "Beratung konnte nicht angelegt werden.");
        return;
      }

      router.push(`/consultations/${payload.data.id}` as Route);
      router.refresh();
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beratung starten</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="patientReference">
              Patientenreferenz
            </label>
            <Input id="patientReference" {...form.register("patientReference")} />
            <p className="text-sm text-destructive">{form.formState.errors.patientReference?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="specialty">
              Fachbereich
            </label>
            <Input id="specialty" {...form.register("specialty")} />
            <p className="text-sm text-destructive">{form.formState.errors.specialty?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="spokenLanguage">
              Spracheinstellung
            </label>
            <select
              id="spokenLanguage"
              className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              {...form.register("spokenLanguage")}
            >
              <option value="de">Deutsch</option>
              <option value={LANGUAGE_DETECT_VALUE}>Sprache erkennen</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Deutsch ist fuer deutsche Konsultationen optimiert. Sprache erkennen identifiziert die gesprochene Sprache
              automatisch und erstellt die klinische Notiz auf Deutsch.
            </p>
            <p className="text-sm text-destructive">{form.formState.errors.spokenLanguage?.message}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="consultationType">
              Beratungsart
            </label>
            <Input id="consultationType" {...form.register("consultationType")} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/consultations")}>
              Abbrechen
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? "Wird gestartet..." : "Beratung starten"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
