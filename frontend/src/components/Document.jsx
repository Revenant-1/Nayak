import { X, FileText, Upload } from "lucide-react";

export default function DocumentModal({
  open,
  onClose,
  documents = [],
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-line bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Your Documents
            </h2>

            <p className="mt-1 text-xs text-mist">
              Documents uploaded for your legal queries
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-2 text-mist transition-colors hover:bg-panel-hi hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {/* Documents */}
        <div className="max-h-[400px] overflow-y-auto p-4">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={36} className="mb-3 text-mist" />

              <p className="text-sm font-medium text-ink">
                No documents uploaded
              </p>

              <p className="mt-1 text-xs text-mist">
                Upload a document to start asking questions about it.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((document, index) => (
                <div
                  key={document.id ?? index}
                  className="flex items-center gap-3 rounded-lg border border-line bg-panel-hi px-3 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {document.name}
                    </p>

                    {document.size && (
                      <p className="mt-0.5 text-xs text-mist">
                        {document.size}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line px-5 py-3">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            <Upload size={16} />
            Upload document
          </button>
        </div>
      </div>
    </div>
  );
}