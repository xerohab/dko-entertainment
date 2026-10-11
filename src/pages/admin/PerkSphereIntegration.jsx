import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function PerkSphereIntegration() {
  const { user } = useOutletContext();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);
  if (user?.role !== "admin") return <p>Administrator access required.</p>;

  async function verify() {
    setRunning(true);
    setReport(null);
    setError("");
    try {
      const response = await base44.functions.invoke("partnerProofOfPossession", {});
      const data = response?.data || {};
      setReport({
        ok: data.ok === true,
        possessionVerified: data.possessionVerified === true,
        activated: data.activated === true,
        stage: data.stage || "unknown",
        errorCode: data.errorCode || data.code || null,
        message: data.message || null,
      });
    } catch (err) {
      const raw = err?.response?.data;
      const data = raw?.data && typeof raw.data === "object" ? raw.data : raw;
      const status = err?.response?.status || err?.status;
      const code = data?.errorCode || data?.code || err?.code || "request_failed";
      const safeMessage = typeof data?.message === "string" && /^[a-zA-Z0-9 .,;:()_/-]{1,180}$/.test(data.message) ? data.message : null;
      const sdkMessage = typeof err?.message === "string" && /^[a-zA-Z0-9 .,;:()_/-]{1,180}$/.test(err.message) ? err.message : null;
      const message = safeMessage || sdkMessage || "Request failed. See function execution details.";
      const diagnostics = [status && `HTTP ${status}`, err?.name && `type ${err.name}`, err?.response ? "HTTP response received" : "No HTTP response exposed"].filter(Boolean).join("; ");
      setError(`Verification error (${code}): ${message}${diagnostics ? ` (${diagnostics})` : ""}`);
    } finally {
      setRunning(false);
    }
  }

  async function sendOnboardingTest() {
    if (!window.confirm("Send one signed, test-only registration event to PerkSphere Linux? No rewards will be issued.")) return;
    setTestRunning(true);
    setTestResult(null);
    try {
      const response = await base44.functions.invoke("partnerSendOnboardingTest", { confirm: true });
      const data = response?.data || response;
      setTestResult({ ok: data?.ok === true, code: data?.code || "unknown", message: data?.message || "No response message." });
    } catch (err) {
      const data = err?.response?.data;
      setTestResult({ ok: false, code: data?.code || "request_failed", message: data?.message || "Test request failed. Check the backend execution details." });
    } finally { setTestRunning(false); }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-oswald font-bold text-foreground">PerkSphere Integration</h1>
        <p className="text-sm text-muted-foreground mt-2">DKO Entertainment partner credential verification. Credentials are held in Base44 Application Secrets and are never displayed here.</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5" /> Proof of possession</div>
        <p className="text-sm text-muted-foreground">Run the existing server-side challenge and signature check. This does not activate the integration, submit reward events or change credentials.</p>
        <button type="button" disabled={running} onClick={verify} className="rounded bg-primary px-4 py-2 text-white font-medium disabled:opacity-50 flex items-center gap-2">
          {running && <Loader2 className="h-4 w-4 animate-spin" />}
          {running ? "Verifying…" : "Verify PerkSphere Connection"}
        </button>
        {error && <div role="alert" className="rounded border border-red-500/40 p-3 text-sm">{error}</div>}
        {report && <div role="status" className="rounded border border-border p-4 space-y-2 text-sm">
          <p className="font-semibold">{report.ok && report.possessionVerified ? "Credentials verified" : "Verification not completed"}</p>
          <p>Stage: {report.stage}</p>
          <p>Proof verified: {report.possessionVerified ? "Yes" : "No"}</p>
          <p>Linux activation: {report.activated ? "Active" : "Not active"}</p>
          {report.errorCode && <p>Error code: {report.errorCode}</p>}
          {report.message && <p>{report.message}</p>}
        </div>}
      </div>
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Pre-activation signed test event</h2>
        <p className="text-sm text-muted-foreground">Send one admin-approved, test-only registration event from DKO Entertainment to Linux. This uses the existing server-side partner credentials, does not enable live rewards, and records a Linux test receipt if accepted.</p>
        <button type="button" disabled={testRunning} onClick={sendOnboardingTest} className="rounded bg-primary px-4 py-2 text-white font-medium disabled:opacity-50">
          {testRunning ? "Sending signed test…" : "Send signed registration test"}
        </button>
        {testResult && <div role="status" className="rounded border border-border p-3 text-sm">
          <p className="font-semibold">{testResult.ok ? "Linux test receipt recorded" : "Test not confirmed"}</p>
          <p>Code: {testResult.code}</p><p>{testResult.message}</p>
        </div>}
      </div>
    </div>
  );
}
