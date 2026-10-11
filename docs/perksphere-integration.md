# Perk Sphere partner integration — dko-entertainment

Development branch: `launch-readiness-2026-10-10`. No production deployment,
partner activation, account reset or existing payment change has been performed.

This adds authenticated account-link confirmation, possession-proof/probe tools,
server-only HMAC signing, protected link/event entities and a member connection
panel. Member-submitted reward evidence is blocked. Unlinking does not erase
local verified links before Perk Sphere confirms authoritative revocation.

## Configuration and publication (not executed)

1. In Perk Sphere Admin Partners, prepare a new partner for this exact app/domain.
   Leave the integration disabled. Do not reuse DKO Wrestling or Xero Streams keys.
2. Provision a **new** Linux partner credential through the existing approved
   onboarding workflow. New credentials remain pending; store the secret directly
   in this app's Base44 secret settings. Do not paste it into chat or GitHub.
3. Configure `PERKSPHERE_PARTNER_UUID`, `PERKSPHERE_PARTNER_KEY_ID`,
   `PERKSPHERE_PARTNER_HMAC_SECRET`, `PERKSPHERE_PARTNER_SITE_URL`, and
   `PERKSPHERE_PARTNER_DOMAIN` for this partner. Site URL must be its real HTTPS
   address; domain must be its host name. `PERKSPHERE_PARTNER_ENABLED` stays
   unset/false until onboarding and owner approval are complete.
4. Review the diff, publish the added entities/functions in the **existing**
   Base44 app (6a103683a6ef187b171ab5e9), and publish the frontend only after approval.
   Do not create another app or overwrite existing secrets/integrations.
5. Complete possession/domain verification using the existing partner onboarding
   tools. Activate only with the owner's explicit approval; setting the local
   feature flag does not activate a Linux partner or prove a credential.
6. Once approved/configured, sign in to Perk Sphere, generate a challenge in
   Partner Accounts, then paste the challenge into this site's connection panel.
   Linux binds both authenticated identities before recording a verified link.

## Validation and limits

Tests use synthetic identities and mock secrets only. HMAC, nonce compatibility,
member submission denial, disabled setup and preservation on unlink are covered.
Builds, syntax and lint pass. DKO Entertainment also passes full type checking;
The Front Row retains substantial pre-existing whole-app TypeScript diagnostics.
Both retain seven Tailwind build-tool dependency advisories (five high, two
moderate), despite patch updates and removal of the unused vulnerable editor.
These checks are development evidence, not certification of a live integration.

Publishing requires Base44 console/server access and explicit approval. Actual
credentials, possession verification, cross-app browser login/linking, and all
reward delivery tests remain required before activation.
