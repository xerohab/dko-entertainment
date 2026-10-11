import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  loadCredentials, signRequest, PERKSPHERE_API_BASE,
  PERKSPHERE_PARTNER_UUID, EXPECTED_KEY_ID
} from '../../shared/perkSphereClient.ts';

// Admin-triggered, signed PRE-ACTIVATION test only. Never calls production /events.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, code: 'unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, code: 'forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (body.confirm !== true || Object.keys(body).some(k => k !== 'confirm')) {
      return Response.json({ ok: false, code: 'confirmation_required' }, { status: 400 });
    }
    if (PERKSPHERE_PARTNER_UUID !== '501e87e0-fbd0-4bff-bde4-f1f480d23f48') {
      return Response.json({ ok: false, code: 'partner_identity_mismatch' }, { status: 409 });
    }
    const creds = loadCredentials();
    if (!EXPECTED_KEY_ID || creds.keyId !== EXPECTED_KEY_ID) {
      return Response.json({ ok: false, code: 'credential_mismatch' }, { status: 409 });
    }
    const id = crypto.randomUUID();
    const payload = {
      event_type: 'registration_completed',
      partner_event_id: `dko-onboarding-${id}`,
      partner_account_reference: `dko-onboarding-test-${id}`,
      occurred_at: new Date().toISOString(),
      evidence: { registration_reference: `dko-onboarding-registration-${id}` }
    };
    const path = '/partners/test-event';
    const rawBody = JSON.stringify(payload);
    const headers = await signRequest('POST', path, rawBody, creds);
    const response = await fetch(`${PERKSPHERE_API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: rawBody,
      signal: AbortSignal.timeout(10000)
    });
    const result = await response.json().catch(() => ({}));
    const verified = response.ok && result.ok === true && result.validated === true &&
      result.test_only === true && result.rewards_issued === false &&
      result.event_persisted === false && result.test_receipt_recorded === true &&
      result.partner_uuid === PERKSPHERE_PARTNER_UUID &&
      result.event_type === 'registration_completed';
    return Response.json({
      ok: verified,
      code: verified ? 'test_receipt_recorded' : (result.error?.code || 'test_not_verified'),
      http_status: response.status,
      test_only: verified,
      rewards_issued: false,
      partner_event_id: verified ? payload.partner_event_id : undefined,
      message: verified ? 'Linux accepted the signed onboarding test and recorded a receipt.' : 'Linux did not confirm the onboarding test.'
    }, { status: verified ? 200 : 502 });
  } catch (error) {
    return Response.json({ ok: false, code: error?.code || 'test_request_failed', message: 'Signed onboarding test could not be completed.' }, { status: 503 });
  }
}
