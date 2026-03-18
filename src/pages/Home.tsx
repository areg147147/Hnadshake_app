import { SignInButton, UserButton, useAuth } from '@clerk/react'
import { useMutation } from 'convex/react'
import { Handshake, Link2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { contractsApi } from '@/convex/contracts'

export function Home() {
  const { isSignedIn } = useAuth()
  const createContract = useMutation(contractsApi.createContract)
  const navigate = useNavigate()

  const [terms, setTerms] = useState('')
  const [existingId, setExistingId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onCreateContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!terms.trim()) {
      setError('Write initial terms before creating the contract.')
      return
    }

    setIsCreating(true)
    try {
      const contractId = await createContract({ initialTerms: terms.trim() })
      navigate(`/contract/${contractId}`)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create contract')
    } finally {
      setIsCreating(false)
    }
  }

  function onOpenExisting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = existingId.trim()
    if (!trimmed) {
      return
    }

    const idFromUrl = trimmed.includes('/') ? trimmed.split('/').pop() ?? '' : trimmed
    navigate(`/contract/${idFromUrl}`)
  }

  return (
    <div className="container py-10 sm:py-16">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-sm">
            <Handshake className="h-4 w-4" />
            Handshake
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Seal agreements with intent.</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Negotiate live, revise terms transparently, and lock a pact forever only when both participants
            hold to seal at the same time.
          </p>
          <div className="flex justify-center">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <Button>Sign in to create a contract</Button>
              </SignInButton>
            ) : (
              <div className="rounded-full border bg-card p-1">
                <UserButton />
              </div>
            )}
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-5 w-5" />
                Create a new contract
              </CardTitle>
              <CardDescription>Start a negotiation thread and get a shareable URL instantly.</CardDescription>
            </CardHeader>
            <CardContent>
              {!isSignedIn ? (
                <div className="space-y-3 rounded-lg border border-dashed p-4">
                  <p className="text-sm text-muted-foreground">
                    Authentication is required so only verified users can seal contracts.
                  </p>
                  <SignInButton mode="modal">
                    <Button className="w-full">Sign in with Clerk</Button>
                  </SignInButton>
                </div>
              ) : null}

              {isSignedIn ? (
                <form onSubmit={onCreateContract} className="space-y-4">
                  <Textarea
                    value={terms}
                    onChange={(event) => setTerms(event.target.value)}
                    placeholder="Write the first draft of your terms..."
                    className="min-h-40"
                  />
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create contract'}
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Link2 className="h-5 w-5" />
                Open an existing contract
              </CardTitle>
              <CardDescription>Paste a full URL or contract id.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onOpenExisting} className="space-y-4">
                <Input
                  value={existingId}
                  onChange={(event) => setExistingId(event.target.value)}
                  placeholder="https://your-app/contract/...."
                />
                <Button type="submit" variant="secondary" className="w-full">
                  Open contract
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
