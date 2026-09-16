import { useRef, useState } from 'react'
import { Send, Mic, Paperclip, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function InputBar({
  onSend,
  micActive,
  onToggleMic,
  micSupported,
  disabled,
  language,
  languages,
  onLanguageChange,
  onUploadDocument,
  uploadingDocument = false,
  uploadError = null,
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onUploadDocument) return

    setSelectedFile(file)
    try {
      await onUploadDocument(file)
    } finally {
      setSelectedFile(null)
    }
  }

  return (
    <div className="border-t border-line bg-panel px-4 py-3">
      {uploadError && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
          <span>{uploadError}</span>
        </div>
      )}

      {selectedFile && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-line bg-panel-hi px-3 py-2 text-xs text-mist">
          <Paperclip size={13} className="text-primary" />
          <span className="min-w-0 flex-1 truncate">{selectedFile.name}</span>
          {uploadingDocument && <Loader2 size={13} className="animate-spin text-primary" />}
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFile}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadingDocument}
          title="Upload document"
          aria-label="Upload document"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-panel-hi text-mist transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploadingDocument ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
        </button>

        <button
          type="button"
          onClick={() => !micActive && onToggleMic()}
          disabled={disabled || !micSupported}
          title={
            micSupported
              ? micActive ? t('useOrb') : t('startVoiceInput')
              : t('unsupportedVoice')
          }
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
            micActive
              ? 'border-magenta bg-magenta/20 text-magenta'
              : 'border-line bg-panel-hi text-mist hover:text-ink'
          } ${!micSupported ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          <Mic size={16} />
        </button>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={disabled ? t('processing') : t('askPlaceholder')}
          disabled={disabled}
          className="chat-input flex-1 rounded-full border border-line bg-panel-hi px-4 py-2.5 text-sm text-ink placeholder:text-mist focus-visible:outline-cyan disabled:opacity-50"
        />

        <label className="sr-only" htmlFor="input-language">{t('language')}</label>
        <select
          id="input-language"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          aria-label={t('language')}
          title={t('chooseVoiceLanguage')}
          translate="no"
          className="notranslate max-w-28 rounded-lg border border-line bg-panel-hi px-2 py-2.5 text-xs text-ink outline-none focus:border-cyan"
        >
          {languages.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code === 'auto' ? t('auto') : item.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iris text-white transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
