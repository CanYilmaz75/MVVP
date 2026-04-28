# CAREVO Admin Access Policy

Status: operational draft  
Applies to: CAREVO pilot operations, suppliers, repositories, deployment, monitoring, and databases  
Last reviewed: 2026-04-28

## Principles

- Least privilege is mandatory.
- Production access is granted only to named people, not shared accounts.
- Service-role credentials are restricted to Engineering Lead and Security Lead or explicitly approved deputies.
- Production secrets must not be shared in chat, email, screenshots, tickets, or docs.
- Access must be removed within 24 hours of offboarding or role change.
- Admin access must be reviewed monthly during pilot and quarterly afterward.

## Access Classes

| System | Admin access allowed for | Notes |
| --- | --- | --- |
| GitHub repository | Engineering Lead, approved engineers | Branch protection required before pilot. |
| Vercel project | Engineering Lead, Security Lead | Production env changes restricted. |
| Supabase production | Engineering Lead, Security Lead | Service role key access restricted. |
| Supabase staging | Engineering, Security | Used for drills and UAT. |
| Sentry | Engineering, Security, Incident Owner | Raw request body capture must remain disabled. |
| Upstash | Engineering, Security | Rate-limit tokens restricted. |
| OpenAI/provider dashboard | AI Owner, Engineering Lead | Provider usage and key access reviewed. |
| Support mailbox/project | Support, Incident Owner, Engineering | No raw health data in tickets. |

## Access Request Process

1. Requester states system, role, reason, duration, and data access level.
2. Owner approves based on least privilege.
3. Security Lead approves production or secret-bearing access.
4. Access is granted to named account only.
5. Access register is updated.
6. Temporary access receives an expiry date.

## Offboarding Process

Within 24 hours:

1. Remove GitHub, Vercel, Supabase, Sentry, Upstash, AI provider, and support access.
2. Rotate secrets if the person had access to production secrets or service-role credentials.
3. Transfer open incidents/support tickets.
4. Record completion in the access review log.

## Monthly Access Review

During pilot, Security Lead must review:

- all production admins
- Supabase service-role access
- Vercel environment variable access
- Sentry project access
- AI provider dashboard access
- support mailbox/project access
- departed team members or contractors

## Access Register

| Person/team | System | Role | Environment | Approved by | Granted date | Expiry | Review status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | Staging / production | TBD | TBD | TBD | Open |

## Launch Gate

Production launch is blocked until:

- production admins are named and approved
- service-role key access is limited to approved technical owners
- offboarding owner is assigned
- first access review is completed
