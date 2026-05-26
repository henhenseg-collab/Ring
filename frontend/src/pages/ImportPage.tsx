import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'
import { Upload, FileText, Sparkles } from 'lucide-react'

type InputMode = 'notes' | 'pdf' | 'topic'

export default function ImportPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [mode, setMode] = useState<InputMode>('notes')
  const [topicName, setTopicName] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!topicName.trim()) {
      toast.error('Please enter a topic name')
      return
    }
    if (mode === 'notes' && !notes.trim()) {
      toast.error('Please paste some notes')
      return
    }
    if (mode === 'pdf' && !file) {
      toast.error('Please select a PDF')
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append('topic_name', topicName)
      if (mode === 'notes') form.append('notes', notes)
      if (mode === 'pdf' && file) form.append('file', file)
      if (mode === 'topic') form.append('notes', '')

      const res = await api.post('/generate', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await qc.invalidateQueries({ queryKey: ['topics'] })
      toast.success(`Generated ${res.data.card_count} cards!`)
      navigate(`/quiz/${res.data.topic_id}`)
    } catch (err: any) {
      const detail = err.response?.data?.detail ?? ''
      const msg = detail.includes('Claude API') || err.response?.status === 502
        ? 'Claude API unavailable — add ANTHROPIC_API_KEY to .env and restart the backend'
        : detail || 'Generation failed'
      toast.error(msg, { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: InputMode; label: string; Icon: any }[] = [
    { id: 'notes', label: 'Paste Notes', Icon: FileText },
    { id: 'pdf', label: 'Upload PDF', Icon: Upload },
    { id: 'topic', label: 'Topic Name', Icon: Sparkles },
  ]

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="font-inter text-2xl font-bold text-gray-900 dark:text-white">New Topic</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Claude will generate 15 study cards automatically
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        {/* Topic name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Topic Name
          </label>
          <input
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="e.g. React Hooks, French Revolution..."
            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-recall-purple dark:focus:border-recall-violet transition-colors"
          />
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1 gap-1">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                mode === id
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Content input */}
        {mode === 'notes' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Paste your notes
            </label>
            <textarea
              rows={8}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste your lecture notes, textbook excerpts, or any study material here..."
              className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3.5 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-recall-purple dark:focus:border-recall-violet transition-colors resize-none"
            />
          </div>
        )}

        {mode === 'pdf' && (
          <div>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-recall-purple dark:hover:border-recall-violet transition-colors"
            >
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              {file ? (
                <p className="text-sm font-medium text-recall-purple dark:text-recall-violet">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload PDF</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max 20MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {mode === 'topic' && (
          <div className="bg-recall-lavender dark:bg-recall-purple/10 rounded-xl p-4">
            <div className="flex gap-2">
              <Sparkles size={16} className="text-recall-purple dark:text-recall-violet shrink-0 mt-0.5" />
              <p className="text-sm text-recall-purple dark:text-recall-violet">
                Claude will generate questions about <strong>{topicName || 'your topic'}</strong> from its knowledge base.
              </p>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          loading={loading}
        >
          {loading ? 'Generating with Claude...' : 'Generate Study Cards'}
        </Button>
      </div>
    </div>
  )
}
