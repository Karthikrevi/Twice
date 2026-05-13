import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { logout } from "@/hooks/useAuth";

export default function DataPrivacy() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onExport = async () => {
    if (exporting) return;
    setExporting(true);
    setError(null);
    try {
      const response = await api.post("/privacy/export-data", undefined, {
        responseType: "blob",
      });
      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([JSON.stringify(response.data, null, 2)], {
              type: "application/json",
            });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `once-data-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't generate the export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const onDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await api.post("/privacy/delete-account");
      setConfirmOpen(false);
      logout(navigate);
    } catch {
      setError("Couldn't complete the deletion. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <p className="text-text-secondary text-xs uppercase tracking-widest font-semibold mt-6 mb-3">
        Data &amp; Privacy
      </p>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Export */}
        <div className="flex items-center px-4 py-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-text-primary font-medium text-sm">
              Export my data
            </p>
            <p className="text-text-secondary text-xs mt-0.5">
              Download a JSON copy of every personal record Once holds about
              your account.
            </p>
          </div>
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="text-amber text-xs font-semibold rounded-lg px-3 h-8 transition-colors hover:bg-amber/20 disabled:opacity-50"
            style={{
              backgroundColor: "#F5A62322",
              border: "1px solid #F5A62366",
            }}
          >
            {exporting ? "Preparing…" : "Export"}
          </button>
        </div>

        <div className="h-px bg-border" />

        {/* Delete */}
        <div className="flex items-center px-4 py-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-text-primary font-medium text-sm">
              Delete restaurant account
            </p>
            <p className="text-text-secondary text-xs mt-0.5">
              Anonymises every staff account and the customer fields on
              past orders. Order totals are retained for tax compliance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="bg-status-urgent text-white rounded-lg px-3 h-8 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Delete
          </button>
        </div>

        {error ? (
          <p className="text-status-urgent text-xs px-4 pb-3">{error}</p>
        ) : null}
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-text-primary font-bold text-xl tracking-tight">
              Delete restaurant account?
            </h2>
            <p className="text-text-secondary text-sm mt-2">
              This permanently removes all personal data. Order records are
              kept for legal compliance (UAE FTA requires 5 years on tax
              invoices) but customer names, addresses, staff names and
              emails are anonymised. This cannot be undone.
            </p>

            {error ? (
              <p className="text-status-urgent text-xs mt-3">{error}</p>
            ) : null}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 h-11 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl bg-status-urgent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
