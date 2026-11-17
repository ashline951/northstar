# Entra ID app registration — request for the Identity team

**Project:** Northstar (proof of concept)
**Requested by:** Ryan
**App type:** Next.js web app, server-side OIDC authorization code flow with PKCE
**Library:** Auth.js v5 (`next-auth`), `microsoft-entra-id` provider

This is a short, standard web app registration. Roughly five minutes of work.

---

## 1. Create the app registration

Entra admin center → **App registrations** → **New registration**

| Field | Value |
|---|---|
| Name | `Northstar POC` |
| Supported account types | **Single tenant** (accounts in this organizational directory only) |
| Redirect URI platform | **Web** |

## 2. Redirect URIs

Platform: **Web**. Add each of these (exact match, no wildcards):

```
http://localhost:3000/api/auth/callback/microsoft-entra-id
https://<production-domain>/api/auth/callback/microsoft-entra-id
```

The path is fixed by the library — it must end in
`/api/auth/callback/microsoft-entra-id`.

**Note on Vercel previews:** every preview deployment gets a unique generated
hostname, and Entra requires exact redirect URIs. Rather than registering a URI
per deploy, we will pin the app to one stable domain (a Vercel production domain
or a fixed preview alias) and give you that hostname. One production URI is
enough.

**Front-channel logout URL** (optional, enables clean sign-out):
```
https://<production-domain>/api/auth/signout
```

## 3. API permissions

Microsoft Graph → **Delegated**:

- `openid`
- `profile`
- `email`

That is the whole list. These are the standard OIDC sign-in scopes and normally
need no admin consent. The app does **not** request `User.Read` or any other
Graph scope — it only signs users in and reads name and email from the ID token.
If anything beyond this is ever needed, it will come back to you as a new request.

## 4. Client secret

**Certificates & secrets** → **New client secret**

- Description: `Northstar POC`
- Expiry: shortest option that covers the POC (6 months is fine)
- Copy the secret **Value** (not the Secret ID) — it is only shown once

## 5. Optional claim: email

The `email` claim is not always present in the ID token for work accounts. If
the signed-in user's `mail` attribute is not populated, the app will show a blank
email.

**Token configuration** → **Add optional claim** → **ID** → `email`

Worth doing up front; it is the most common thing to miss here.

## 6. Who can sign in

Default is anyone in the tenant. If you would rather scope it:

**Enterprise applications** → Northstar POC → **Properties** → set
*Assignment required* to **Yes**, then assign a specific group under **Users and groups**.

Recommended for a POC — it keeps the blast radius to the demo audience.

---

## What to send back

Three values. The first two are not secret; the third is.

| Value | Where it is in the portal |
|---|---|
| Application (client) ID | Overview |
| Directory (tenant) ID | Overview |
| Client secret **Value** | Certificates & secrets (shown once at creation) |

**Please send the client secret through a secrets channel, not email or chat.**
It goes into a `.env.local` file (gitignored) and Vercel environment variables.
It will not be committed to the repository.

---

## Context worth knowing

This POC is currently hosted on a **personal Vercel account** while it is being
built, using **synthetic data only** — no PHI, no production system access, no
real patient or employee records. If that changes, it moves to work-owned
infrastructure first.

If you would prefer this registration live in a non-production or dev tenant
rather than the production LLUH tenant, that works equally well — the app takes
the tenant ID as configuration, so switching later is a change of three
environment variables and no code.
