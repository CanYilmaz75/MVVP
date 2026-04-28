# AI Incident and Change Process

Status: operational draft  
Last reviewed: 2026-04-28

## AI Incident Definition

An AI incident is any event where an AI feature causes or could cause:

- Incorrect, misleading, or harmful clinical documentation.
- Unauthorized disclosure or processing of personal or health data.
- Cross-tenant data exposure.
- Unapproved export or downstream use.
- Significant availability failure for a critical AI workflow.
- Repeated quality degradation or unsafe model behavior.

## Severity Levels

| Severity | Definition | Examples | Required response |
| --- | --- | --- | --- |
| Critical | Real or likely harm, breach, or cross-tenant exposure. | Wrong patient data visible, health data sent to wrong tenant, harmful note exported. | Disable affected feature, incident bridge, legal/privacy triage, management notification. |
| High | Serious incorrect output or privacy/security weakness without confirmed harm. | Repeated hallucinations, provider misconfiguration, logs contain sensitive data. | Contain, investigate, notify owners, remediation plan. |
| Medium | Degraded quality or localized workflow failure. | Transcription quality drop, validation warning spike. | Triage, monitor, fix in planned release if contained. |
| Low | Minor issue with low impact. | Cosmetic draft label issue, non-sensitive log metadata. | Track and resolve. |

## Incident Workflow

1. Detect through user report, monitoring, audit review, test failure, supplier notice, or security review.
2. Record incident with severity, timestamp, reporter, affected feature, tenant, data categories, and immediate action.
3. Contain using feature flags, rate limits, provider disablement, access revocation, or deployment rollback.
4. Preserve evidence without copying raw health data into tickets unless approved and protected.
5. Assess privacy breach implications with the Data Protection Lead.
6. Assess clinical/documentation implications with the Clinical Reviewer.
7. Remediate code, prompt, schema, workflow, supplier configuration, or documentation.
8. Verify remediation with tests, audit-log review, and targeted UAT.
9. Close only after accountable owner approval.
10. Feed lessons learned into the risk register and management review.

## Emergency Controls

CAREVO has feature-level disablement patterns for:

- AI transcription: `assertTranscriptionEnabled`
- AI note generation: `assertNoteGenerationEnabled`
- SIS extraction: `assertSisExtractionEnabled`
- Voice edit: `assertVoiceEditEnabled`

Evidence: `src/lib/ai-guard.ts`, `src/lib/feature-flags.ts`.

## AI Change Definition

AI changes include:

- Model name/version changes.
- AI provider changes.
- Prompt changes.
- JSON schema changes.
- Validation logic changes.
- Approval/export workflow changes.
- New data fields sent to AI providers.
- New retention, logging, or monitoring behavior.

## Change Workflow

1. Create a change record with owner, rationale, risk, affected data, and rollback plan.
2. Update or create an AI impact assessment.
3. Review GDPR and supplier implications if data processing changes.
4. Run automated tests.
5. Run targeted clinical UAT for output-affecting changes.
6. Confirm logs do not contain raw health data.
7. Approve by AI Owner and Engineering Lead; include Data Protection Lead and Clinical Reviewer when relevant.
8. Release behind feature flag where practical.
9. Monitor KPIs after release.
10. Update risk register and management review inputs.

## Change Record Template

| Field | Value |
| --- | --- |
| Change ID | AIC-YYYY-NNN |
| Description | TBD |
| Feature | TBD |
| Data affected | TBD |
| Risk rating | TBD |
| Tests run | TBD |
| UAT result | TBD |
| Rollback plan | TBD |
| Approvals | TBD |
| Release date | TBD |
