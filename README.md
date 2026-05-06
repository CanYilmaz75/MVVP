# CAREVO

CAREVO ist eine deutschsprachige Anwendung fuer klinische und pflegerische Dokumentation.

Die frueheren englischen Projektunterlagen und Originalfassungen der App-Dateien wurden im Ordner `English/` abgelegt. Die aktive Anwendung im Root und unter `src/` ist fuer die weitere Arbeit zunaechst auf Deutsch ausgerichtet.

## Aktueller Stand

Stand: 2026-05-06.

- Next.js 15 App Router mit TypeScript, Tailwind, ShadCN/Radix-Komponenten und Supabase-Anbindung.
- Geschuetzter App-Bereich mit Login, Signup, Dashboard, Beratungen, Beratungsarbeitsplatz, SIS, Vorlagen, Exporte und Einstellungen.
- Organisationsmodell unterscheidet Pflegeeinrichtung und medizinische Praxis. Die Navigation und Beratungssprache passen sich daran an (`Pflegeberatung` vs. `Praxisberatung`).
- SIS ist als pflegebezogener Workflow unter `/sis` umgesetzt und nutzt die bestehende Beratungs-, Audio-, Transkriptions- und Persistenzpipeline.
- Team-/Billing-Verwaltung, produktionsnahe Care-Boundaries, Audit-/RLS-Absicherung, Export-Service, AI-Provider-Abstraktion und Rate-Limit-Grundlagen sind vorhanden.
- Die aktive UI folgt der CAREVO-Designlinie "Klinische Stille" mit neutralem App-Hintergrund `#F4F4F6`, ruhiger Typografie und reduzierten Linien statt kartenlastiger Oberflaechen.

## Entwicklung

```bash
npm install
npm run dev
```

Die benoetigten Umgebungsvariablen werden ueber `.env.local` gesetzt. Eine Beispielkonfiguration liegt in `.env.example`.

## Wichtige Befehle

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

## Datenbank

Die aktiven Supabase-Migrationen liegen unter `supabase/migrations/`. Die historische englische Ausgangsfassung liegt unter `English/`.

Wichtige neuere Migrationen:
- `0008_organisation_care_setting.sql`: Organisations-Care-Setting fuer Pflegeeinrichtung oder medizinische Praxis.
- `0009_consultation_care_protocols.sql`: Care-Protokolle an Beratungen.
- `0010_production_care_boundaries.sql`: produktionsnahe fachliche Grenzen fuer Pflege und medizinische Behandlung.
- `0011_fix_signup_trigger_care_setting.sql`: Signup-Trigger-Haertung fuer Care-Setting.
