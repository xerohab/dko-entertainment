import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function PerkSphereIntegration() {
  const { user } = useOutletContext();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  if (user?.role !== "admin") return <p>Administrator access required.</p>;

  async function verify() {
    setRunning(true);
    setReport(null);
    setError("");
    try {
      const response = await base44.functions.partnerProofOfPossession({});
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
      const data = err?.response?.data;
      const status = err?.response?.status;
      const code = data?.errorCode || data?.code || err?.code || "request_failed";
      const message = typeof data?.message === "string" ? data.message : "The verification function could not complete. Check Base44 function logs if this persists.";
      setError(`Verification error (${code}${status ? `, HTTP ${status}` : ""}): ${message}`);
    } finally {
      setRunning(false);
    }
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
    </div>
  );
}
