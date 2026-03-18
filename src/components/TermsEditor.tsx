import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface TermsEditorProps {
  initialTerms: string
  disabled?: boolean
  onSubmit: (terms: string) => Promise<void>
}

export function TermsEditor({ initialTerms, disabled = false, onSubmit }: TermsEditorProps) {
  const [draft, setDraft] = useState(initialTerms)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(initialTerms)
  }, [initialTerms])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = draft.trim()

    if (!normalized) {
      setError('Terms cannot be empty.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit(normalized)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to propose terms')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current terms</CardTitle>
        <CardDescription>Every update creates a permanent entry in the negotiation log.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-48"
            disabled={disabled}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={disabled || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Propose revision'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
