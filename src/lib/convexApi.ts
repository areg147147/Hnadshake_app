import { makeFunctionReference } from 'convex/server'

import type { ContractView, NegotiationEntry, SealStatusView } from '@/types/contracts'

export const convexApi = {
  contracts: {
    createContract: makeFunctionReference<'mutation', { initialTerms: string }, string>(
      'contracts:createContract',
    ),
    getContract: makeFunctionReference<'query', { contractId: string }, ContractView>(
      'contracts:getContract',
    ),
    joinContract: makeFunctionReference<'mutation', { contractId: string }, ContractView | null>(
      'contracts:joinContract',
    ),
  },
  negotiation: {
    proposeTerms: makeFunctionReference<
      'mutation',
      { contractId: string; proposedTerms: string },
      null
    >('negotiation:proposeTerms'),
    getNegotiationLog: makeFunctionReference<'query', { contractId: string }, NegotiationEntry[]>(
      'negotiation:getNegotiationLog',
    ),
  },
  seal: {
    startHold: makeFunctionReference<'mutation', { contractId: string }, null>('seal:startHold'),
    releaseHold: makeFunctionReference<'mutation', { contractId: string }, null>('seal:releaseHold'),
    evaluateSeal: makeFunctionReference<'mutation', { contractId: string }, { isSealed: boolean }>(
      'seal:evaluateSeal',
    ),
    getSealStatus: makeFunctionReference<'query', { contractId: string }, SealStatusView>(
      'seal:getSealStatus',
    ),
  },
}
