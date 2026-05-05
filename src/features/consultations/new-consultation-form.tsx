"use client";

import { useState, useTransition } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CARE_PROTOCOLS, type CareProtocolSlug } from "@/lib/care-protocols";
import { isCareFacility, type CareSetting } from "@/lib/care-setting";
import { LANGUAGE_DETECT_VALUE } from "@/lib/language-settings";

const schema = z.object({
  patientReference: z.string().min(2, "Patientenreferenz ist erforderlich."),
  specialty: z.string().min(2, "Fachbereich ist erforderlich."),
  spokenLanguage: z.string().min(2, "Sprache ist erforderlich."),
  noteTemplateId: z.string().optional(),
  consultationType: z.enum(["care_consultation", "medical_consultation"]),
  careProtocols: z.array(z.string()).optional()
});

type FormValues = z.infer<typeof schema>;
export type ConsultationTemplateOption = {
  id: string;
  name: string;
  specialty: string;
};

export function NewConsultationForm({
  careSetting,
  templates
}: {
  careSetting: CareSetting;
  templates: ConsultationTemplateOption[];
}) {
  const router = useRouter();
  const isCare = isCareFacility(careSetting);
  const consultationLabel = isCare ? "Pflegeberatung" : "Beratung fuer Praxen und Mediziner";
  const specialtyDefault = isCare ? "Pflegeberatung" : "Praxis / Medizin";
  const consultationType = isCare ? "care_consultation" : "medical_consultation";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientReference: "",
      specialty: specialtyDefault,
      spokenLanguage: "de",
      noteTemplateId: "",
      consultationType,
      careProtocols: []
    }
  });
  const selectedCareProtocols = form.watch("careProtocols") ?? [];

  function toggleCareProtocol(protocol: CareProtocolSlug) {
    const current = form.getValues("careProtocols") ?? [];
    form.setValue(
      "careProtocols",
      current.includes(protocol) ? current.filter((item) => item !== protocol) : [...current, protocol],
      { shouldDirty: true }
    );
  }

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
    <div className="w-full">
      <h2 className="text-2xl font-semibold">{consultationLabel} starten</h2>
      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="patientReference">
              Patientenreferenz
            </label>
            <Input id="patientReference" {...form.register("patientReference")} />
            <p className="text-sm text-destructive">{form.formState.errors.patientReference?.message}</p>
          </div>
          {isCare ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="specialty">
                Bereich
              </label>
              <Input id="specialty" readOnly {...form.register("specialty")} />
              <p className="text-sm text-destructive">{form.formState.errors.specialty?.message}</p>
            </div>
          ) : (
            <input type="hidden" {...form.register("specialty")} />
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="spokenLanguage">
              Spracheinstellung
            </label>
            <select
              id="spokenLanguage"
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
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
          {templates.length ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="noteTemplateId">
                Vorlage
              </label>
              <select
                id="noteTemplateId"
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                {...form.register("noteTemplateId")}
              >
                <option value="">Keine Vorlage</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} · {template.specialty}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {isCare ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="consultationType">
                Beratungsart
              </label>
              <Input id="consultationTypeLabel" readOnly value={consultationLabel} />
              <input type="hidden" {...form.register("consultationType")} />
            </div>
          ) : (
            <input type="hidden" {...form.register("consultationType")} />
          )}
          {isCare ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Pflegeprotokolle</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Die Auswahl steuert die Notizerstellung und die offenen Themen/Fragen im Entwurf.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {CARE_PROTOCOLS.map((protocol) => (
                  <label
                    key={protocol.slug}
                    className="flex min-h-11 items-start gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={selectedCareProtocols.includes(protocol.slug)}
                      onChange={() => toggleCareProtocol(protocol.slug)}
                    />
                    <span>{protocol.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
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
    </div>
  );
}
