import { SignInButton, UserButton, useAuth } from '@clerk/react'
import { useQuery } from 'convex/react'
import { Link, useParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

import { ContractReceipt } from '@/components/ContractReceipt'
import { NegotiationLog } from '@/components/NegotiationLog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { contractsApi } from '@/convex/contracts'
import { negotiationApi } from '@/convex/negotiation'
import type { NegotiationEntry } from '@/types/contracts'

export function SealedPage() {
  const { isSignedIn } = useAuth()
  const { contractId: routeId } = useParams()
  const contractId = routeId
  const contract = useQuery(contractsApi.getContract, contractId ? { contractId } : 'skip')
  const entries =
    (useQuery(negotiationApi.getNegotiationLog, contractId ? { contractId } : 'skip') as
      | NegotiationEntry[]
      | undefined) ?? []

  if (!contractId) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Missing contract id</CardTitle>
            <CardDescription>The sealed page needs a valid contract link.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button>Go home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="container py-10">
        <p className="text-sm text-muted-foreground">Loading sealed contract...</p>
      </div>
    )
  }

  if (contract.status !== 'sealed') {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Contract is still negotiating</CardTitle>
            <CardDescription>The receipt is available only after sealing.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to={`/contract/${contractId}`}>
              <Button>Return to contract</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const termsToDisplay = contract.sealedTerms ?? contract.terms

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sealed forever
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Handshake receipt</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <Button variant="outline">Sign in</Button>
              </SignInButton>
            ) : (
              <UserButton />
            )}
            <Link to="/">
              <Button variant="secondary">Create another contract</Button>
            </Link>
          </div>
        </header>

        <ContractReceipt
          creatorId={contract.creatorId}
          counterpartyId={contract.counterpartyId}
          terms={termsToDisplay}
          createdAt={contract.createdAt}
          sealedAt={contract.sealedAt}
        />

        <NegotiationLog entries={entries} creatorId={contract.creatorId} />
      </div>
    </div>
  )
}
