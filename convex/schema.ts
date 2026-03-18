import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  contracts: defineTable({
    status: v.union(v.literal('negotiating'), v.literal('sealed')),
    creatorId: v.string(),
    counterpartyId: v.union(v.string(), v.null()),
    terms: v.string(),
    createdAt: v.number(),
    sealedAt: v.union(v.number(), v.null()),
    sealedTerms: v.union(v.string(), v.null()),
  })
    .index('by_creatorId', ['creatorId'])
    .index('by_counterpartyId', ['counterpartyId'])
    .index('by_status', ['status']),

  negotiation_log: defineTable({
    contractId: v.id('contracts'),
    authorId: v.string(),
    proposedTerms: v.string(),
    createdAt: v.number(),
  }).index('by_contractId_createdAt', ['contractId', 'createdAt']),

  seal_intent: defineTable({
    contractId: v.id('contracts'),
    userId: v.string(),
    holdStartedAt: v.number(),
  })
    .index('by_contractId', ['contractId'])
    .index('by_contractId_userId', ['contractId', 'userId']),
})
