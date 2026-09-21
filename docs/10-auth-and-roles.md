# Authentication & Roles

## Principle: sign-in is a feature, not a gate

Menu, crowding, dish details, opening hours and announcements are **public**. No account, no
splash screen, no cookie banner between a student and the answer they came for.

An account is requested at the exact moment a feature requires one — tapping a heart, rating a
dish, adding a visit. The prompt explains why, and after signing in the user lands back on the
action they were attempting.

This matters for the pilot: the target is 300 unique users in roughly thirteen operating days.
Every screen placed before the value costs a measurable share of them.

## Chosen method: email code to `@s.unibuc.ro`

The user enters their institutional address and receives a six-digit code.

This was chosen over institutional single sign-on for one reason: **SSO is not confirmed.** It
was an idea in the group chat, nobody has formally requested it from UB digitalisation, and it
sits behind the same bureaucracy as the server and the domain — all three still verbal.

Email codes take a day to build, depend on nobody, and verify exactly what matters: that the
person holds a UB student address.

### Rules

- Only addresses ending in `@s.unibuc.ro` are accepted for the student role
- Codes are six digits, valid for ten minutes, single use
- Rate limited per address and per IP
- Sessions are long-lived — students should not re-authenticate to check a menu
- Failed attempts are throttled with increasing delay

> **NOTE** — Official canteen policy restricts access to students and employees. Staff may hold
> a different address domain; confirm during the site visit and add the domain to the allowlist
> for the `canteen_staff` account.

### If SSO arrives later

Institutional SSO can be added as a second sign-in method without disturbing existing accounts,
because accounts are keyed on the email address. A user who signed in by code and later uses
SSO with the same address lands in the same account.

Design the session layer with this in mind; do not couple session handling to the code flow.

## Roles

| Role | Who | Can |
|---|---|---|
| *(anonymous)* | Anyone | Menu, dish details, crowding, hours, announcements, submit a wait report, submit feedback |
| `student` | Verified `@s.unibuc.ro` | All of the above plus favourites, ratings, loyalty, personal history, notification preferences |
| `canteen_staff` | **One shared account** | Publish menus, manage the catalogue, post announcements, redeem reward codes |
| `dccas_admin` | DCCAS | Read-only dashboard and exports |
| `tech_admin` | The three developers | Everything, plus configuration: crowding thresholds, camera zones, schedule |

### Why canteen staff share one account

Whoever is on duty uses it. Individual accounts mean remembered passwords in a kitchen, which
means a password written on a wall, which means the feature is not used.

The cost is losing the audit trail of who edited what. For a daily menu, that is an acceptable
trade. `daily_menus.published_by` still records that it was the canteen account, and the time.

Reward redemption is the one action where attribution might matter later; if it does, add a
staff PIN on top of the shared session rather than splitting the account.

## Anonymous participation

Wait reports and feedback may both be submitted without an account. This is intentional — both
feed results the project must report (R8, R11), and requiring sign-in would suppress volume.

The cost is that per-user rate limiting cannot be enforced against anonymous submissions.
Mitigations: anonymous wait reports carry **half weight** in the fusion, and the weighted median
plus camera arbitration absorb the rest. See [07-crowding-module.md](07-crowding-module.md).

## Sessions and security

- Session tokens in `httpOnly`, `Secure`, `SameSite=Lax` cookies
- HTTPS everywhere — mandatory anyway, since a PWA will not install without it
- No password exists in the system, so no password can be stolen from it
- Service-to-service authentication for the vision service is a single rotatable token; the
  vision service holds no database credentials
- Role checks enforced server-side on every endpoint, never inferred from the client

## Account deletion

A student can delete their account from within the app. On deletion:

- The account is soft-deleted and the email released
- Ratings and feedback are retained but detached from the user
- Loyalty ledger rows are removed, since they are personal by nature
- Receipt hashes are retained in an anonymous form, to preserve duplicate protection

## Open items

- [ ] Confirm the email domain used by canteen staff
- [ ] Decide whether to formally request SSO from UB digitalisation, and by what date
- [ ] Choose a transactional email provider and confirm delivery to `@s.unibuc.ro` is not
      filtered — test this early, institutional mail servers are strict
