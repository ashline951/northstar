# DNS request — northstar.lluh.app

**Project:** Northstar (proof of concept)
**Requested by:** Ryan
**Zone:** `lluh.app` (Cloudflare)
**Scope:** One DNS record. No zone settings change, no other subdomain affected.

---

## The record

Cloudflare dashboard → `lluh.app` → **DNS** → **Add record**

| Field | Value |
|---|---|
| Type | `CNAME` |
| Name | `northstar` |
| Target | `cname.vercel-dns.com` |
| Proxy status | **DNS only** (grey cloud) — see below |
| TTL | Auto |

> **Confirm the target before creating it.** Vercel displays the exact CNAME
> target when the domain is added to the project, and it is occasionally a
> region-specific hostname rather than the generic one above. Use whatever the
> Vercel dashboard shows.

## The proxy setting matters

Set proxy status to **DNS only** (grey cloud), not **Proxied** (orange cloud).

With the proxy on, Cloudflare terminates TLS and re-originates to Vercel. If the
zone's SSL/TLS mode is **Flexible**, Cloudflare connects to Vercel over HTTP,
Vercel redirects to HTTPS, and the request loops — `ERR_TOO_MANY_REDIRECTS`.
Vercel's HTTP-to-HTTPS redirect cannot be disabled. Proxying can also block
Vercel's certificate issuance, producing a "failed to generate cert" state.

Vercel provisions and renews its own TLS certificate for the hostname, so the
proxy is not adding protection here.

**If zone policy requires everything be proxied**, it can work, but:
- SSL/TLS encryption mode must be **Full (Strict)**, never Flexible
- Expect certificate issuance to need the record temporarily set to DNS only
- Check that no existing page rule or redirect rule for `*.lluh.app` applies a
  conflicting scheme or destination

Please flag it if proxying is mandatory, rather than switching it on silently —
it changes how we debug the first connection.

## Possible second record

When the domain is added, Vercel may also ask for a one-time `TXT` verification
record (`_vercel.lluh.app`). If so, it will be sent across as a separate request
with the exact value. It can be deleted once verification completes.

---

## What this does and does not touch

- Creates: `northstar.lluh.app`
- Does not affect: `lluh.app` apex, `www`, mail/MX, or any other existing record
- Reversible: deleting the one CNAME fully undoes it

## What to send back

Confirmation that the record exists and its proxy status. Nothing secret is
involved — there are no credentials in this request.
