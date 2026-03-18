import { format } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { NegotiationEntry } from '@/types/contracts'

interface NegotiationLogProps {
  entries: NegotiationEntry[]
  creatorId: string
}

function shortUser(userId: string) {
  return userId.length > 10 ? `${userId.slice(0, 6)}...${userId.slice(-4)}` : userId
}

export function NegotiationLog({ entries, creatorId }: NegotiationLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Negotiation log</CardTitle>
        <CardDescription>Append-only history of every proposed version of terms.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No proposals yet.</p>
        ) : (
          entries.map((entry, index) => (
            <div key={entry._id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{format(entry.createdAt, 'MMM d, HH:mm:ss')}</span>
                <span>
                  {entry.authorId === creatorId ? 'Creator' : 'Counterparty'} ({shortUser(entry.authorId)})
                </span>
              </div>
              <p className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">{entry.proposedTerms}</p>
              {index < entries.length - 1 ? <Separator /> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
