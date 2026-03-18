import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

async function getAuthenticatedUserIdOrThrow(ctx: { auth: { getUserIdentity: () => Promise<{ subject?: string; tokenIdentifier: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity()
  console.log('DEBUG auth identity:', JSON.stringify(identity))
  if (!identity) {
    throw new Error('Authentication required.')
  }

  return identity.subject ?? identity.tokenIdentifier
}

async function getAuthenticatedUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject?: string; tokenIdentifier: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    return null
  }

  return identity.subject ?? identity.tokenIdentifier
}

export const createContract = mutation({
  args: {
    initialTerms: v.string(),
  },
  handler: async (ctx, args) => {
    const creatorId = await getAuthenticatedUserIdOrThrow(ctx)
    const now = Date.now()
    const normalizedTerms = args.initialTerms.trim()

    if (!normalizedTerms) {
      throw new Error('Initial terms cannot be empty.')
    }

    const contractId = await ctx.db.insert('contracts', {
      status: 'negotiating',
      creatorId,
      counterpartyId: null,
      terms: normalizedTerms,
      createdAt: now,
      sealedAt: null,
      sealedTerms: null,
    })

    await ctx.db.insert('negotiation_log', {
      contractId,
      authorId: creatorId,
      proposedTerms: normalizedTerms,
      createdAt: now,
    })

    return contractId
  },
})

export const getContract = query({
  args: {
    contractId: v.id('contracts'),
  },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId)
    if (!contract) {
      throw new Error('Contract not found.')
    }

    const userId = await getAuthenticatedUserId(ctx)
    const isParticipant = Boolean(userId && (userId === contract.creatorId || userId === contract.counterpartyId))

    return {
      ...contract,
      canEdit: contract.status === 'negotiating' && isParticipant,
      isParticipant,
    }
  },
})

export const joinContract = mutation({
  args: {
    contractId: v.id('contracts'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserIdOrThrow(ctx)
    const contract = await ctx.db.get(args.contractId)
    if (!contract) {
      throw new Error('Contract not found.')
    }

    if (contract.status !== 'negotiating') {
      throw new Error('Sealed contracts cannot be changed.')
    }

    if (userId === contract.creatorId || userId === contract.counterpartyId) {
      return contract
    }

    if (contract.counterpartyId) {
      return contract
    }

    await ctx.db.patch(contract._id, {
      counterpartyId: userId,
    })

    return await ctx.db.get(contract._id)
  },
})
