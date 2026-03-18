export type ContractStatus = 'negotiating' | 'sealed'

export interface ContractView {
  _id: string
  status: ContractStatus
  creatorId: string
  counterpartyId: string | null
  terms: string
  createdAt: number
  sealedAt: number | null
  sealedTerms: string | null
  canEdit: boolean
  isParticipant: boolean
}

export interface NegotiationEntry {
  _id: string
  contractId: string
  authorId: string
  proposedTerms: string
  createdAt: number
}

export interface SealStatusView {
  canAttemptSeal: boolean
  isCurrentUserHolding: boolean
  currentUserHoldStartedAt: number | null
  counterpartHoldStartedAt: number | null
  overlapMs: number
  isSealed: boolean
}
