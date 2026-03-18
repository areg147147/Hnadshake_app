import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

const REQUIRED_OVERLAP_MS = 3000
const NETWORK_GRACE_MS = 200

async function getUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject?: string; tokenIdentifier: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    return null
  }
  return identity.subject ?? identity.tokenIdentifier
}

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject?: string; tokenIdentifier: string } | null> } }) {
  const userId = await getUserId(ctx)
  if (!userId) {
    throw new Error('Authentication required.')
  }
  return userId
}

function assertParticipant(contract: { creatorId: string; counterpartyId: string | null }, userId: string) {
  if (userId !== contract.creatorId && userId !== contract.counterpartyId) {
    throw new Error('Only contract participants can seal.')
  }
}

export const startHold = mutation({
  args: {
    contractId: v.id('contracts'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const contract = await ctx.db.get(args.contractId)
    if (!contract) {
      throw new Error('Contract not found.')
    }
    if (contract.status !== 'negotiating') {
      throw new Error('Contract already sealed.')
    }
    assertParticipant(contract, userId)

    const existingIntent = await ctx.db
      .query('seal_intent')
      .withIndex('by_contractId_userId', (queryBuilder) =>
        queryBuilder.eq('contractId', args.contractId).eq('userId', userId),
      )
      .first()

    const holdStartedAt = Date.now()
    if (existingIntent) {
      await ctx.db.patch(existingIntent._id, { holdStartedAt })
      return
    }

    await ctx.db.insert('seal_intent', {
      contractId: args.contractId,
      userId,
      holdStartedAt,
    })
  },
})

export const releaseHold = mutation({
  args: {
    contractId: v.id('contracts'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const contract = await ctx.db.get(args.contractId)
    if (!contract) {
      throw new Error('Contract not found.')
    }
    assertParticipant(contract, userId)

    const intent = await ctx.db
      .query('seal_intent')
      .withIndex('by_contractId_userId', (queryBuilder) =>
        queryBuilder.eq('contractId', args.contractId).eq('userId', userId),
      )
      .first()
    if (intent) {
      await ctx.db.delete(intent._id)
    }
  },
})

export const evaluateSeal = mutation({
  args: {
    contractId: v.id('contracts'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const contract = await ctx.db.get(args.contractId)

    if (!contract) {
      throw new Error('Contract not found.')
    }
    if (contract.status === 'sealed') {
      return { isSealed: true }
    }

    assertParticipant(contract, userId)
    if (!contract.counterpartyId) {
      return { isSealed: false, waitingForCounterparty: true }
    }

    const intents = await ctx.db
      .query('seal_intent')
      .withIndex('by_contractId', (queryBuilder) => queryBuilder.eq('contractId', args.contractId))
      .collect()

    const creatorIntent = intents.find((intent) => intent.userId === contract.creatorId)
    const counterpartyIntent = intents.find((intent) => intent.userId === contract.counterpartyId)

    if (!creatorIntent || !counterpartyIntent) {
      return { isSealed: false }
    }

    const overlapStart = Math.max(creatorIntent.holdStartedAt, counterpartyIntent.holdStartedAt)
    const overlapMs = Date.now() - overlapStart

    if (overlapMs < REQUIRED_OVERLAP_MS - NETWORK_GRACE_MS) {
      return { isSealed: false, overlapMs }
    }

    const sealedAt = Date.now()
    await ctx.db.patch(contract._id, {
      status: 'sealed',
      sealedAt,
      sealedTerms: contract.terms,
    })

    await Promise.all(intents.map((intent) => ctx.db.delete(intent._id)))
    return { isSealed: true, sealedAt }
  },
})

export const getSealStatus = query({
  args: {
    contractId: v.id('contracts'),
  },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId)
    if (!contract) {
      throw new Error('Contract not found.')
    }

    const userId = await getUserId(ctx)
    const isParticipant = Boolean(userId && (userId === contract.creatorId || userId === contract.counterpartyId))

    const intents = await ctx.db
      .query('seal_intent')
      .withIndex('by_contractId', (queryBuilder) => queryBuilder.eq('contractId', args.contractId))
      .collect()

    const ownIntent = userId ? intents.find((intent) => intent.userId === userId) : null
    const counterpartIntent =
      userId && contract.creatorId === userId
        ? intents.find((intent) => intent.userId === contract.counterpartyId)
        : userId
          ? intents.find((intent) => intent.userId === contract.creatorId)
          : null

    const now = Date.now()
    const overlapMs =
      ownIntent && counterpartIntent ? Math.max(0, now - Math.max(ownIntent.holdStartedAt, counterpartIntent.holdStartedAt)) : 0

    return {
      canAttemptSeal: contract.status === 'negotiating' && isParticipant,
      isCurrentUserHolding: Boolean(ownIntent),
      currentUserHoldStartedAt: ownIntent?.holdStartedAt ?? null,
      counterpartHoldStartedAt: counterpartIntent?.holdStartedAt ?? null,
      overlapMs,
      isSealed: contract.status === 'sealed',
    }
  },
})
