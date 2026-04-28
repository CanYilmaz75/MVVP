# SIS-Funktion

## Ziel

Die SIS-Funktion bildet die Strukturierte Informationssammlung als Einstieg in den Pflegeprozess ab. Sie soll Pflegefachkraefte dabei unterstuetzen, die individuelle Situation einer pflegebeduerftigen Person fokussiert zu erfassen, relevante Risiken gezielt zu markieren und daraus eine Massnahmenplanung abzuleiten.

Die Funktion folgt drei Leitgedanken:

- Fokus auf das Wesentliche statt Vollstaendigkeitsdokumentation um jeden Preis.
- Die fachliche Einschaetzung der Pflegekraft steht neben der Sichtweise der betroffenen Person.
- Vertieft dokumentiert werden nur Risiken, die fuer die konkrete Situation relevant sind.

## Route und Einstieg

Die Arbeitsflaeche ist unter `/sis` erreichbar und im geschuetzten App-Bereich ueber die Sidebar verlinkt.

Die Seite besteht aus:

- Kopfbereich mit Patientenreferenz und Leitfrage `Was ist der Person wichtig?`
- sprachgefuehrter SIS-Session mit Aufnahme oder Audio-Upload
- dynamischen Fragenvorschlaegen zum aktuell offenen Themenfeld
- Live-Notizen waehrend des Gespraechs
- Transkriptanzeige nach Abschluss der Aufnahme
- sechs Themenfeldern der SIS
- strukturierter Risikoeinschaetzung
- automatisch gesammeltem Massnahmenfokus
- Vorschau fuer Berichteblatt und Evaluation
- Kopierfunktion fuer die zusammengefasste SIS

## Sprachgefuehrter Ablauf

Die SIS kann direkt per Sprache gestartet werden. Technisch wird dafuer eine interne Beratungssitzung mit dem Typ `sis` erzeugt. Dadurch nutzt die SIS die vorhandene Audio-Infrastruktur der Anwendung:

1. Die Pflegekraft startet `SIS per Sprache starten`.
2. Die Anwendung nimmt das Gespraech im Browser auf.
3. Waehrend der Aufnahme zeigt die linke Fuehrungsspalte passende Fragen zum aktuell ausgewaehlten SIS-Themenfeld.
4. Die Pflegekraft kann das aktive Themenfeld wechseln, wenn das Gespraech zu einem anderen Bereich springt.
5. Kurze Live-Notizen koennen parallel eingegeben werden.
6. Nach `Aufnahme stoppen` wird die Audio-Datei hochgeladen, transkribiert und automatisch in die SIS-Struktur ueberfuehrt.

Die Fragenvorschlaege orientieren sich an noch nicht gefuellten SIS-Bereichen. Wenn zum Beispiel die individuelle Sichtweise noch fehlt, fragt die Anwendung zuerst nach der Perspektive der Person. Wenn Risiken noch nicht betrachtet wurden, erscheinen passende Risiko-Fragen wie Sturz, Schmerz oder Ernaehrung.

## Themenfelder

Die Funktion bildet folgende Themenfelder ab:

1. Kognitive und kommunikative Faehigkeiten
2. Mobilitaet und Beweglichkeit
3. Krankheitsbezogene Anforderungen und Belastungen
4. Selbstversorgung
5. Leben in sozialen Beziehungen
6. Wohnen / Haeuslichkeit

Jedes Themenfeld hat vier Erfassungsbereiche:

- Individuelle Sichtweise
- Fachliche Einschaetzung
- Ressourcen
- Unterstuetzungsbedarf / Massnahmenhinweis

Die Hinweise im Feld `Unterstuetzungsbedarf / Massnahmenhinweis` werden zeilenweise ausgewertet und automatisch in die Massnahmenplanung uebernommen.

## Risikoeinschaetzung

Aktuell sind folgende Risiken hinterlegt:

- Sturzrisiko
- Dekubitusrisiko
- Mangelernaehrung
- Inkontinenz
- Schmerzen

Jedes Risiko wird zuerst als relevant oder nicht relevant markiert. Nur relevante Risiken koennen mit einer vertieften Bewertung versehen werden:

- Beobachten
- Massnahme erforderlich

Damit folgt die Funktion dem SIS-Prinzip, nicht jedes Risiko schematisch zu vertiefen, sondern nur fachlich begruendete Risiken weiter zu betrachten.

## Strukturmodell

Die Funktion ordnet die SIS in das vierstufige Strukturmodell ein:

1. SIS: Informationssammlung mit Sichtweise der Person, Ressourcen, Einschätzung und Risiken.
2. Massnahmenplanung: automatische Sammlung aus Unterstuetzungsbedarfen und relevanten Risiken.
3. Berichteblatt: Fokus auf Abweichungen und relevante Veraenderungen.
4. Evaluation: gezielte Wiedervorlage der erfassten Beobachtungs- und Evaluationspunkte.

## Aktuelle technische Umsetzung

Die Umsetzung besteht aus einer clientseitigen Arbeitsflaeche in `src/features/sis/sis-workspace.tsx`,
persistenten Supabase-Tabellen und einem serverseitigen SIS-Service.

Aktueller Stand:

- SIS-Daten werden nach der Extraktion in `sis_assessments` gespeichert.
- Jede Speicherung erzeugt eine unveraenderliche Version in `sis_assessment_versions`.
- Audio-Aufnahme, Audio-Upload und Transkription nutzen die bestehende Beratungspipeline.
- Eine SIS-Sitzung wird als Beratung mit `consultationType: "sis"` angelegt.
- Die API `POST /api/sis/extract` strukturiert Transkript und Live-Notizen in SIS-Felder und persistiert das Ergebnis.
- `GET` und `PUT` auf `/api/consultations/[id]/sis` laden bzw. speichern die aktuelle SIS-Version.
- Die zusammengefasste SIS kann in die Zwischenablage kopiert werden.
- RLS schuetzt SIS-Daten organisationsbezogen; Versionen werden nur hinzugefuegt und nicht ueberschrieben.

## Naechste sinnvolle Ausbaustufen

- SIS mit Bewohner- oder Beratungsreferenzen verbinden.
- Freigabeprozess analog zu Notes einfuehren.
- Export als PDF in den bestehenden Export-Service integrieren.
- Validierung fuer Pflichtfelder und fachliche Warnhinweise ergaenzen.
