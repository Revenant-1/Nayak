import { useState } from "react";
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { api } from "../lib/api.js";

function downloadScript(script, grievanceId) {
  const blob = new Blob([script], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nayak-grievance-${grievanceId}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Grievance({ onClose }) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      setResult(await api.createGrievance(form));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-line bg-panel-hi px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-void/70 p-4 backdrop-blur-sm">
      <section className="glass w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">

        <header className="mb-6 flex justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-accent">
              <FileText size={18} />
              <span className="font-mono text-[10px] uppercase tracking-widest">
                Citizen support
              </span>
            </div>

            <h2 className="font-display text-2xl font-semibold text-ink">
              Raise a grievance
            </h2>

            <p className="mt-1 text-sm text-mist">
              Submit an issue and keep a copy of your complaint script.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close grievance form"
            className="h-9 w-9 rounded-xl text-mist hover:bg-accent/5 hover:text-ink"
          >
            <X size={18} />
          </button>
        </header>

        {result ? (
          <div className="space-y-4">

            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
              <p className="font-medium text-ink">
                Grievance submitted
              </p>
              <p className="mt-1 text-sm text-mist">
                Reference: {result.id}
              </p>
            </div>

            <button
              onClick={() =>
                downloadScript(result.script, result.id)
              }
              className="gradient-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
            >
              <Download size={17} />
              Download grievance script
            </button>

            <button
              onClick={onClose}
              className="w-full rounded-xl border border-line px-4 py-3 text-sm text-mist hover:bg-panel-hi hover:text-ink"
            >
              Close
            </button>

          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">

            {error && (
              <div className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle size={17} className="shrink-0" />
                {error}
              </div>
            )}

            <label className="block text-sm text-mist">
              Subject
              <input
                name="title"
                required
                maxLength={200}
                value={form.title}
                onChange={updateField}
                className={inputClass}
              />
            </label>

            <label className="block text-sm text-mist">
              Category
              <select
                name="category"
                required
                value={form.category}
                onChange={updateField}
                className={inputClass}
              >
                <option value="">Select a category</option>
                <option>Public services</option>
                <option>Government scheme</option>
                <option>Cooperation</option>
                <option>Agriculture</option>
                <option>Other</option>
              </select>
            </label>

            <label className="block text-sm text-mist">
              Location
              <input
                name="location"
                maxLength={255}
                value={form.location}
                onChange={updateField}
                placeholder="City, district, or office"
                className={inputClass}
              />
            </label>

            <label className="block text-sm text-mist">
              Details
              <textarea
                name="description"
                required
                minLength={10}
                maxLength={10000}
                rows={6}
                value={form.description}
                onChange={updateField}
                className={inputClass}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="gradient-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <FileText size={17} />
              )}

              {submitting
                ? "Submitting grievance..."
                : "Submit grievance"}
            </button>

          </form>
        )}
      </section>
    </div>
  );
}