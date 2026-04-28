# AI Roles and Responsibilities

Status: operational draft  
Last reviewed: 2026-04-28

## Role Model

| Role | Core responsibility | Required evidence |
| --- | --- | --- |
| Management Representative | Approves AIMS scope, policy, resources, risk appetite, and management reviews. | Signed policy, management review records |
| AI System Owner | Owns CAREVO AI workflows, model/provider choices, AI risk register, feature flags, and release readiness. | Risk register, change approvals, impact assessments |
| Data Protection Lead | Owns GDPR basis, DPIA/DSFA, processor reviews, privacy notices, retention, and data subject request process. | GDPR gap register, DPIA, DPA/AVV register |
| Security Lead | Owns RLS, private storage, secrets, access controls, logging hygiene, and incident coordination. | Security test results, incident records |
| Clinical Reviewer | Defines clinical acceptance criteria, reviews AI output risks, approves clinical wording controls. | Clinical validation notes, UAT records |
| Engineering Lead | Implements and maintains technical controls, tests, migrations, provider boundaries, and audit hooks. | PRs, test results, architecture docs |
| Incident Owner | Coordinates AI, security, and privacy incident triage and post-incident review. | Incident tickets, postmortems |
| Supplier Owner | Reviews AI, database, hosting, monitoring, and rate-limit suppliers. | Supplier assessments, DPA status, exit plans |
| End User / Clinician | Reviews, edits, and approves AI drafts before export or downstream use. | Approval event in audit logs |

## RACI Matrix

| Activity | Management | AI Owner | DPL | Security | Clinical | Engineering |
| --- | --- | --- | --- | --- | --- | --- |
| Define AI policy | A | R | C | C | C | C |
| Maintain risk register | C | A/R | C | C | C | C |
| Complete AI impact assessment | C | A/R | C | C | C | R |
| Complete DPIA/DSFA | A | C | R | C | C | C |
| Approve model/provider change | A | R | C | C | C | C |
| Implement technical controls | I | C | C | C | C | A/R |
| Triage AI incident | I | A/R | C | C | C | R |
| Triage personal data breach | I | C | A/R | R | C | C |
| Run internal audit | A | R | C | C | C | C |
| Management review | A/R | R | C | C | C | C |

Legend: R = Responsible, A = Accountable, C = Consulted, I = Informed.

## Current Assignments

| Role | Assigned person/team | Status |
| --- | --- | --- |
| Management Representative | TBD | Open |
| AI System Owner | TBD | Open |
| Data Protection Lead | TBD | Open |
| Security Lead | TBD | Open |
| Clinical Reviewer | TBD | Open |
| Engineering Lead | TBD | Open |
| Incident Owner | TBD | Open |
| Supplier Owner | TBD | Open |

## Separation of Duties

- The person approving clinical output should not be an automated system.
- Changes to AI prompts, schemas, provider configuration, and feature flags require review by at least AI Owner and Engineering Lead.
- Changes affecting health data processing require Data Protection Lead review.
- Production incident closure requires the Incident Owner and the relevant accountable role.

## Training Requirements

All users and maintainers must understand:

- AI output is a draft requiring human review.
- How to report incorrect, harmful, or unexpected AI output.
- What data may and may not be entered into CAREVO.
- How exports and approvals are logged.
- Privacy and security expectations for health data.
