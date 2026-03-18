import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject?: string; tokenIdentifier: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Authentication required.')
  }

  return identity.subject ?? identity.tokenIdentifier
}

function assertParticipant(contract: { creatorId: string; counterpartyId: string | null }, userId: string) {
  const isParticipant = userId === contract.creatorId || userId === contract.counterpartyId
  if (!isParticipant) {
    throw new Error('Only participants can edit this contract.')
  }
}

export const proposeTerms = mutation({
  args: {
    contractId: v.id('contracts'),
    proposedTerms: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const contract = await ctx.db.get(args.contractId)

    if (!contract) {
      throw new Error('Contract not found.')
    }

    if (contract.status !== 'negotiating') {
      throw new Error('Sealed contracts are immutable.')
    }

    assertParticipant(contract, userId)

    const normalizedTerms = args.proposedTerms.trim()
    if (!normalizedTerms) {
      throw new Error('Proposed terms cannot be empty.')
    }

    const now = Date.now()

    await ctx.db.patch(contract._id, {
      terms: normalizedTerms,
    })

    await ctx.db.insert('negotiation_log', {
      contractId: contract._id,
      authorId: userId,
      proposedTerms: normalizedTerms,
      createdAt: now,
    })
  },
})

export const getNegotiationLog = query({
  args: {
    contractId: v.id('contracts'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('negotiation_log')
      .withIndex('by_contractId_createdAt', (queryBuilder) => queryBuilder.eq('contractId', args.contractId))
      .collect()
  },
})
