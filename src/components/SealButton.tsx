import { useCallback, useEffect, useRef, useState } from 'react'
import { ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const REQUIRED_HOLD_MS = 3000

interface SealButtonProps {
  disabled?: boolean
  canAttemptSeal: boolean
  isSealed: boolean
  isCurrentUserHolding: boolean
  counterpartHolding: boolean
  overlapMs: number
  onStartHold: () => Promise<void>
  onReleaseHold: () => Promise<void>
  onTick: () => Promise<void>
}

export function SealButton({
  disabled = false,
  canAttemptSeal,
  isSealed,
  isCurrentUserHolding,
  counterpartHolding,
  overlapMs,
  onStartHold,
  onReleaseHold,
  onTick,
}: SealButtonProps) {
  const [isPressing, setIsPressing] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tickIntervalRef = useRef<number | null>(null)

  const [localProgress, setLocalProgress] = useState(0)
  const localTimerRef = useRef<number | null>(null)
  const progressStartRef = useRef<number | null>(null)
  const baseOverlapRef = useRef(0)

  const bothHolding = isCurrentUserHolding && counterpartHolding

  useEffect(() => {
    baseOverlapRef.current = overlapMs
  }, [overlapMs])

  useEffect(() => {
    if (bothHolding && !isSealed) {
      progressStartRef.current = performance.now()
      baseOverlapRef.current = overlapMs

      const animate = () => {
        if (!progressStartRef.current) return
        const elapsed = performance.now() - progressStartRef.current
        const total = baseOverlapRef.current + elapsed
        setLocalProgress(Math.min(total, REQUIRED_HOLD_MS))
        localTimerRef.current = requestAnimationFrame(animate)
      }
      localTimerRef.current = requestAnimationFrame(animate)

      return () => {
        if (localTimerRef.current !== null) {
          cancelAnimationFrame(localTimerRef.current)
          localTimerRef.current = null
        }
      }
    } else {
      if (localTimerRef.current !== null) {
        cancelAnimationFrame(localTimerRef.current)
        localTimerRef.current = null
      }
      progressStartRef.current = null
      if (!bothHolding) {
        setLocalProgress(0)
      }
    }
  }, [bothHolding, isSealed, overlapMs])

  useEffect(() => {
    return () => {
      if (tickIntervalRef.current !== null) {
        window.clearInterval(tickIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isPressing || disabled || !canAttemptSeal || isSealed) {
      if (tickIntervalRef.current !== null) {
        window.clearInterval(tickIntervalRef.current)
        tickIntervalRef.current = null
      }
      return
    }

    tickIntervalRef.current = window.setInterval(() => {
      void onTick()
    }, 200)

    return () => {
      if (tickIntervalRef.current !== null) {
        window.clearInterval(tickIntervalRef.current)
        tickIntervalRef.current = null
      }
    }
  }, [canAttemptSeal, disabled, isPressing, isSealed, onTick])

  const displayMs = bothHolding ? localProgress : 0
  const progress = (displayMs / REQUIRED_HOLD_MS) * 100

  const handlePressStart = useCallback(async () => {
    if (disabled || isMutating || !canAttemptSeal || isSealed) {
      return
    }

    setError(null)
    setIsMutating(true)
    try {
      await onStartHold()
      await onTick()
      setIsPressing(true)
    } catch (pressError) {
      setError(pressError instanceof Error ? pressError.message : 'Failed to start hold')
    } finally {
      setIsMutating(false)
    }
  }, [canAttemptSeal, disabled, isMutating, isSealed, onStartHold, onTick])

  const handlePressEnd = useCallback(async () => {
    if (!isPressing) {
      return
    }

    setIsPressing(false)
    setError(null)
    try {
      await onReleaseHold()
    } catch (releaseError) {
      setError(releaseError instanceof Error ? releaseError.message : 'Failed to release hold')
    }
  }, [isPressing, onReleaseHold])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Seal the contract
        </CardTitle>
        <CardDescription>
          Both participants must hold at the same time for 3 seconds. Releasing early cancels the attempt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isCurrentUserHolding ? 'default' : 'secondary'}>
            You: {isCurrentUserHolding ? 'holding' : 'idle'}
          </Badge>
          <Badge variant={counterpartHolding ? 'default' : 'secondary'}>
            Counterparty: {counterpartHolding ? 'holding' : 'idle'}
          </Badge>
          {isSealed ? <Badge>Sealed</Badge> : null}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Overlap progress</span>
            <span>{Math.max(0, Math.floor(displayMs))} / 3000 ms</span>
          </div>
          <Progress value={progress} />
        </div>

        <Button
          type="button"
          className="w-full select-none"
          variant={isPressing ? 'destructive' : 'default'}
          disabled={disabled || isMutating || !canAttemptSeal || isSealed}
          onPointerDown={() => {
            void handlePressStart()
          }}
          onPointerUp={() => {
            void handlePressEnd()
          }}
          onPointerLeave={() => {
            void handlePressEnd()
          }}
          onPointerCancel={() => {
            void handlePressEnd()
          }}
        >
          {isSealed ? 'Contract sealed' : isPressing ? 'Holding... keep pressing' : 'Hold to seal'}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  )
}
