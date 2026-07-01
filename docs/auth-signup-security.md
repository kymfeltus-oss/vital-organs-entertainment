# Auth Signup Security — Operations Handbook

> Phase 1 secure create-account flow for `/create-account`. Password hashing is **delegated to Supabase Auth (GoTrue)** — this app never stores plain-text passwords and does not implement custom bcrypt/Argon2 hashing.

## Architecture

| Layer | Responsibility |
|-------|----------------|
| `CreateAccountClient` | Form UI, live password strength, Turnstile widget |
| `POST /api/auth/signup` | Rate limit → Turnstile → sanitize/validate → `supabase.auth.signUp()` |
| `POST /api/auth/resend-verification` | Enumeration-safe confirmation resend |
| Supabase Auth | Password hashing, email confirmation tokens, session cookies |

Legacy `POST /api/auth` with `action: "signup"` returns **410 Gone** — use `/api/auth/signup`.

## Required environment variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Server | Turnstile server verification |
| `UPSTASH_REDIS_REST_URL` | Server | Production rate-limit store |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Upstash REST auth token |
| `NEXT_PUBLIC_TERMS_URL` | Public | Terms of Service link on signup form |
| `NEXT_PUBLIC_PRIVACY_URL` | Public | Privacy Policy link on signup form |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Guest signup + admin tasks |
| `NEXT_PUBLIC_APP_URL` | Public | Auth callback redirect base |

**Local development:** When Turnstile keys are unset, verification is skipped in non-production. Rate limiting falls back to an in-memory store.

## Supabase Dashboard checklist

### Authentication → Providers → Email

- [ ] **Enable email confirmations** for new signups (recommended for production).
- [ ] Set **minimum password length = 10** and require letters + digits (align with app policy).
- [ ] Configure **confirmation link expiry** to **15–60 minutes** (Auth settings / email OTP TTL).

### Authentication → URL Configuration

- [ ] **Site URL** = `NEXT_PUBLIC_APP_URL`
- [ ] **Redirect URLs** include:
  - `{APP_URL}/auth/callback`
  - `{APP_URL}/auth/callback?next=/attendee-dashboard`
  - `{APP_URL}/forgot-password`
  - `{APP_URL}/reset-password`

### Authentication → Email Templates → Confirm signup

- [ ] Customize copy if needed; link must use Supabase `{{ .ConfirmationURL }}`.
- [ ] Redirect lands on `/auth/callback` which completes verification.

## Password policy (app-enforced)

All passwords must satisfy **before** Supabase receives them:

- Minimum **10 characters**
- At least one **lowercase** letter
- At least one **uppercase** letter
- At least one **number**
- At least one **symbol**

Same policy applies to **password reset** (`/reset-password`).

## Abuse prevention

| Control | Setting |
|---------|---------|
| Signup rate limit | **5 attempts / 15 minutes / IP** |
| Resend verification rate limit | **5 attempts / 15 minutes / IP** |
| CAPTCHA | Cloudflare Turnstile on signup submit |
| User enumeration | Generic success message regardless of duplicate email |

## Anti-enumeration messaging

Signup and resend endpoints always return neutral copy:

> *If this email is eligible, check your inbox to continue.*

Never expose whether an email is already registered.

## Verification flow

1. User submits `/create-account` form.
2. Server calls `supabase.auth.signUp()` with `emailRedirectTo` → `/auth/callback?next=…`.
3. If email confirmation is enabled, user sees **Check Your Email** (no session yet).
4. User clicks link → `/auth/callback` → `sync-identity` → redirect to `next` path.
5. **Resend** button calls `POST /api/auth/resend-verification`.

## Security logging rules

- **Never** log `password`, `confirmPassword`, or Turnstile tokens.
- Log only safe metadata: error codes, rate-limit bucket, IP hash if needed.

## Verify local configuration

```bash
node scripts/verify-auth-config.mjs
```

## Cloudflare Turnstile setup

1. Create a Turnstile widget at [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile).
2. Add your domains (`localhost`, production hostname).
3. Copy **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
4. Copy **Secret Key** → `TURNSTILE_SECRET_KEY`

## Upstash Redis setup (production)

1. Create a Redis database at [Upstash Console](https://console.upstash.com/).
2. Copy REST URL and token into `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. Redeploy after setting env vars on Vercel/hosting.
