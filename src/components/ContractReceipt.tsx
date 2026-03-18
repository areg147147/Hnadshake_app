import { format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ContractReceiptProps {
  creatorId: string
  counterpartyId: string | null
  terms: string
  createdAt: number
  sealedAt: number | null
}

function shorten(userId: string | null) {
  if (!userId) {
    return 'Pending'
  }
  return userId.length > 16 ? `${userId.slice(0, 8)}...${userId.slice(-6)}` : userId
}

export function ContractReceipt({
  creatorId,
  counterpartyId,
  terms,
  createdAt,
  sealedAt,
}: ContractReceiptProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          Contract receipt
          {sealedAt ? <Badge>Sealed</Badge> : <Badge variant="secondary">Negotiating</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Creator</p>
            <p className="font-medium">{shorten(creatorId)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Counterparty</p>
            <p className="font-medium">{shorten(counterpartyId)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
            <p className="font-medium">{format(createdAt, 'PPP p')}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sealed</p>
            <p className="font-medium">{sealedAt ? format(sealedAt, 'PPP p') : 'Not sealed yet'}</p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Final terms</p>
          <div className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3">{terms}</div>
        </div>
      </CardContent>
    </Card>
  )
}
