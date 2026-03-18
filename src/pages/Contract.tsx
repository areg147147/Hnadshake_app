import { SignInButton, UserButton, useAuth } from '@clerk/react'
import { useMutation, useQuery } from 'convex/react'
import { Link2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { NegotiationLog } from '@/components/NegotiationLog'
import { SealButton } from '@/components/SealButton'
import { TermsEditor } from '@/components/TermsEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { contractsApi } from '@/convex/contracts'
import { negotiationApi } from '@/convex/negotiation'
import { sealApi } from '@/convex/seal'
import type { NegotiationEntry } from '@/types/contracts'

export function ContractPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { userId, isSignedIn } = useAuth()

  const contractId = params.contractId

  const contract = useQuery(contractsApi.getContract, contractId ? { contractId } : 'skip')
  const entries =
    (useQuery(negotiationApi.getNegotiationLog, contractId ? { contractId } : 'skip') as
      | NegotiationEntry[]
      | undefined) ?? []
  const sealStatus = useQuery(sealApi.getSealStatus, contractId ? { contractId } : 'skip')

  const joinContract = useMutation(contractsApi.joinContract)
  const proposeTerms = useMutation(negotiationApi.proposeTerms)
  const startHold = useMutation(sealApi.startHold)
  const releaseHold = useMutation(sealApi.releaseHold)
  const evaluateSeal = useMutation(sealApi.evaluateSeal)

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!contractId || !contract || !userId) {
      return
    }
    if (contract.status === 'negotiating' && !contract.counterpartyId && userId !== contract.creatorId) {
      void joinContract({ contractId })
    }
  }, [contract, contractId, joinContract, userId])

  useEffect(() => {
    if (contract?.status === 'sealed' && contractId) {
      navigate(`/sealed/${contractId}`, { replace: true })
    }
  }, [contract, contractId, navigate])

  const isParticipant = useMemo(() => {
    if (!contract || !userId) {
      return false
    }
    return userId === contract.creatorId || userId === contract.counterpartyId
  }, [contract, userId])

  if (!contractId) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Missing contract id</CardTitle>
            <CardDescription>Open a valid contract link to continue.</CardDescription>
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

  if (contract === undefined || sealStatus === undefined) {
    return (
      <div className="container py-10">
        <p className="text-sm text-muted-foreground">Loading contract...</p>
      </div>
    )
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Handshake contract</h1>
            <p className="text-sm text-muted-foreground">
              Contract id: <code>{contractId}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <Button variant="outline">Sign in</Button>
              </SignInButton>
            ) : (
              <UserButton />
            )}
            <Button variant="secondary" onClick={() => void copyLink()}>
              <Link2 className="mr-2 h-4 w-4" />
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <TermsEditor
              initialTerms={contract.terms}
              disabled={!isParticipant}
              onSubmit={async (terms) => {
                await proposeTerms({ contractId, proposedTerms: terms })
              }}
            />
            <SealButton
              disabled={!isParticipant}
              canAttemptSeal={sealStatus.canAttemptSeal}
              isSealed={sealStatus.isSealed}
              isCurrentUserHolding={sealStatus.isCurrentUserHolding}
              counterpartHolding={Boolean(sealStatus.counterpartHoldStartedAt)}
              overlapMs={sealStatus.overlapMs}
              onStartHold={async () => {
                await startHold({ contractId })
              }}
              onReleaseHold={async () => {
                await releaseHold({ contractId })
              }}
              onTick={async () => {
                await evaluateSeal({ contractId })
              }}
            />
          </div>

          <NegotiationLog entries={entries} creatorId={contract.creatorId} />
        </div>
      </div>
    </div>
  )
}
