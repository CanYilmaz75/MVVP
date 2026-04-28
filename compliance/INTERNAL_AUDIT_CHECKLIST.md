# Internal Audit Checklist

Status: operational draft  
Cadence: quarterly and before production launch  
Last reviewed: 2026-04-28

## Audit Metadata

| Field | Value |
| --- | --- |
| Audit ID | AUD-YYYY-NNN |
| Auditor | TBD |
| Audit date | TBD |
| Scope | CAREVO AIMS and GDPR readiness |
| Result | Pending |

## AIMS Governance

- [ ] AIMS scope is approved and current.
- [ ] AI policy is approved and communicated.
- [ ] AI roles are assigned.
- [ ] AI risk register is reviewed and current.
- [ ] AI impact assessments exist for active AI features.
- [ ] Management review was completed in the review period.
- [ ] AI incidents and changes are reviewed.

## Technical Controls

- [ ] RLS is enabled for tenant tables.
- [ ] High-risk broad `for all` policies remain removed or justified.
- [ ] Private buckets are used for audio and exported PDFs.
- [ ] Signed URLs are time-limited.
- [ ] Audit logs are written for consultation creation/update, audio upload, transcription, note generation, note edit, approval, export, SIS save, and job events.
- [ ] Clinical notes and SIS assessments create immutable versions.
- [ ] Export requires approval.
- [ ] Feature flags can disable AI functionality.
- [ ] Rate limits are active in environments with Redis configured.
- [ ] `npm test` passes.

## AI Quality and Safety

- [ ] AI output is schema validated.
- [ ] Malformed AI output is rejected or repaired safely.
- [ ] Human approval is required before final export.
- [ ] Validation warnings are reviewed.
- [ ] Clinical Reviewer sampled AI outputs during the period.
- [ ] Prompt/model changes followed the change process.
- [ ] Known AI limitations are communicated to users.

## GDPR and Privacy

- [ ] Privacy notice is final and matches actual processing.
- [ ] Legal basis for personal data processing is documented.
- [ ] Art. 9 basis for health data processing is documented.
- [ ] DPIA/DSFA is completed for production processing.
- [ ] DPA/AVV status is current for all processors.
- [ ] Subprocessors and international transfers are reviewed.
- [ ] Retention and deletion process is documented and tested.
- [ ] Data subject request process is documented and tested.
- [ ] Logs and Sentry are reviewed for sensitive data leakage.

## Supplier Controls

- [ ] Supplier register is current.
- [ ] Critical suppliers have reviewed security documentation.
- [ ] Supplier incident notifications are monitored.
- [ ] Exit plans exist for critical suppliers.
- [ ] AI provider terms cover production health data use.

## Findings

| ID | Finding | Severity | Owner | Due date | Status |
| --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | Open |

## Audit Conclusion

| Area | Rating | Notes |
| --- | --- | --- |
| AIMS governance | TBD | TBD |
| Technical controls | TBD | TBD |
| AI quality | TBD | TBD |
| GDPR readiness | TBD | TBD |
| Supplier readiness | TBD | TBD |

## Sign-Off

| Role | Name | Date |
| --- | --- | --- |
| Auditor | TBD | TBD |
| AI System Owner | TBD | TBD |
| Management Representative | TBD | TBD |
