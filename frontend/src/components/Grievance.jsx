import { useState } from 'react'
import { AlertCircle, Download, FileText, Loader2, X } from 'lucide-react'
import { api } from '../lib/api.js'

function downloadScript(script, grievanceId) {
  const blob = new Blob([script], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `nayak-grievance-${grievanceId}.md`
  link.click()
  URL.revokeObjectURL(url)
}

export default function Grievance({ onClose }) {
  const [form, setForm] = useState({ title: '', category: '', description: '', location: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const data = await api.createGrievance(form)
      setResult(data)
    } catch (submissionError) {
      setError(submissionError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-void/70 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-cyan">
              <FileText size={18} />
              <span className="font-mono text-[10px] uppercase tracking-widest">Citizen support</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-ink">Raise a grievance</h2>
            <p className="mt-1 text-sm text-mist">Submit an issue and keep a copy of your complaint script.</p>
          </div>
          <button onClick={onClose} aria-label="Close grievance form" title="Close" className="rounded-full p-2 text-mist hover:bg-panel-hi hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-jade/30 bg-jade/10 p-4">
              <p className="font-medium text-ink">Grievance submitted</p>
              <p className="mt-1 text-sm text-mist">Reference: {result.id}</p>
            </div>
            <button onClick={() => downloadScript(result.script, result.id)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-iris px-4 py-3 text-sm font-semibold text-white hover:bg-iris/90">
              <Download size={17} /> Download grievance script
            </button>
            <button onClick={onClose} className="w-full rounded-lg border border-line px-4 py-3 text-sm text-mist hover:bg-panel-hi hover:text-ink">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <div className="flex gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"><AlertCircle size={17} className="shrink-0" />{error}</div>}
            <label className="block text-sm text-mist">Subject<input name="title" required maxLength={200} value={form.title} onChange={updateField} className="mt-1 w-full rounded-lg border border-line bg-panel-hi px-3 py-2.5 text-ink outline-none focus:border-cyan" /></label>
            <label className="block text-sm text-mist">Category<select name="category" required value={form.category} onChange={updateField} className="mt-1 w-full rounded-lg border border-line bg-panel-hi px-3 py-2.5 text-ink outline-none focus:border-cyan"><option value="">Select a category</option><option>Public services</option><option>Government scheme</option><option>Cooperation</option><option>Agriculture</option><option>Other</option></select></label>
            <label className="block text-sm text-mist">Location<input name="location" maxLength={255} value={form.location} onChange={updateField} placeholder="City, district, or office" className="mt-1 w-full rounded-lg border border-line bg-panel-hi px-3 py-2.5 text-ink outline-none focus:border-cyan" /></label>
            <label className="block text-sm text-mist">Details<textarea name="description" required minLength={10} maxLength={10000} rows={6} value={form.description} onChange={updateField} className="mt-1 w-full resize-y rounded-lg border border-line bg-panel-hi px-3 py-2.5 text-ink outline-none focus:border-cyan" /></label>
            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-iris px-4 py-3 text-sm font-semibold text-white hover:bg-iris/90 disabled:opacity-50">{submitting ? <Loader2 size={17} className="animate-spin" /> : <FileText size={17} />} Submit grievance</button>
          </form>
        )}
      </section>
    </div>
  )
}
