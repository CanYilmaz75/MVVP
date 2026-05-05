"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { languageLabel } from "@/lib/language-settings";
import type { listConsultations } from "@/server/services/consultation-service";

type ConsultationRow = Awaited<ReturnType<typeof listConsultations>>[number];

export function ConsultationList({ consultations }: { consultations: ConsultationRow[] }) {
  const [query, setQuery] = useState("");
  const filteredConsultations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return consultations;
    }

    return consultations.filter((consultation) => {
      return [
        consultation.patient_reference,
        consultation.specialty,
        consultation.status,
        languageLabel(consultation.spoken_language)
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [consultations, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Beratungen durchsuchen"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {filteredConsultations.length ? (
        <>
          <div className="space-y-3 md:hidden">
            {filteredConsultations.map((consultation) => (
              <Link
                key={consultation.id}
                href={`/consultations/${consultation.id}` as Route}
                className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{consultation.patient_reference}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{consultation.specialty}</p>
                  </div>
                  <StatusBadge status={consultation.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <span>{languageLabel(consultation.spoken_language)}</span>
                  <span className="text-right">{new Date(consultation.updated_at).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/70">
                <tr>
                  <th className="px-4 py-3 font-medium">Patientenreferenz</th>
                  <th className="px-4 py-3 font-medium">Bereich</th>
                  <th className="px-4 py-3 font-medium">Sprache</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Aktualisiert</th>
                  <th className="px-4 py-3 font-medium">Oeffnen</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className="border-t">
                    <td className="px-4 py-3">{consultation.patient_reference}</td>
                    <td className="px-4 py-3">{consultation.specialty}</td>
                    <td className="px-4 py-3">{languageLabel(consultation.spoken_language)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={consultation.status} />
                    </td>
                    <td className="px-4 py-3">{new Date(consultation.updated_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/consultations/${consultation.id}` as Route}>Oeffnen</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Keine Beratungen gefunden.
        </div>
      )}
    </div>
  );
}
