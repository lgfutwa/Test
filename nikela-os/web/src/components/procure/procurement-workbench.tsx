'use client'

import { AlertTriangle, CheckCircle2, MessageCircle, Mic, Sparkles, UserCog } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { MoneyLine } from '@/components/ui/money-line'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatTile } from '@/components/ui/stat-tile'
import { cn } from '@/lib/cn'
import { findSupplier, suppliers } from '@/lib/data/catalogue'
import { currentCycle } from '@/lib/data/cycles'
import { findZone } from '@/lib/data/network'
import { logger } from '@/lib/logger'
import { formatCents, formatPercent, formatRand } from '@/lib/money'
import { buildQuote, type ParsedStockLine, parseStockList } from '@/lib/quote'

const SAMPLE_LIST = '20 maize meal 10kg, 15 oil 2L, 30 sugar 2kg'
const VOICE_NOTE_TRANSCRIPT = '8 rice 10kg, 6 washing powder 2kg, 12 bar soap 500g'

type Stage = 'capture' | 'quoted' | 'confirmed'

/**
 * The spaza procurement workbench.
 *
 * Reproduces the WhatsApp-first flow end to end: a free-text or transcribed
 * stock list is parsed into candidate lines, quoted against the pooled cycle
 * tier with every fee separated, and only becomes an order on an explicit
 * confirmation. A parse never places an order by itself.
 */
export function ProcurementWorkbench() {
  const [rawList, setRawList] = useState(SAMPLE_LIST)
  const [parsed, setParsed] = useState<ParsedStockLine[]>([])
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '')
  const [stage, setStage] = useState<Stage>('capture')
  const [orderRef, setOrderRef] = useState<string | null>(null)

  const quote = useMemo(
    () =>
      buildQuote(
        parsed
          .filter((line) => line.skuId !== null)
          .map((line) => ({
            skuId: line.skuId as string,
            units: line.units,
            supplierId,
            confidence: line.confidence,
          }))
      ),
    [parsed, supplierId]
  )

  const unmatched = parsed.filter((line) => line.skuId === null)
  const zone = findZone(currentCycle.zoneId)

  function handleParse(text: string) {
    const result = parseStockList(text)
    setParsed(result)
    setStage(result.length > 0 ? 'quoted' : 'capture')
    setOrderRef(null)
    logger.info('Stock list parsed', {
      lines: result.length,
      unmatched: result.filter((line) => line.skuId === null).length,
    })
  }

  function handleVoiceNote() {
    setRawList(VOICE_NOTE_TRANSCRIPT)
    handleParse(VOICE_NOTE_TRANSCRIPT)
    logger.info('Voice note transcribed to draft lines', { source: 'voice_note' })
  }

  function handleConfirm() {
    const reference = `NK-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
    setOrderRef(reference)
    setStage('confirmed')
    logger.info('Procurement order confirmed', {
      orderRef: reference,
      landedTotalCents: quote.landedTotalCents,
      savingTotalCents: quote.savingTotalCents,
    })
  }

  function handleReset() {
    setRawList(SAMPLE_LIST)
    setParsed([])
    setStage('capture')
    setOrderRef(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="space-y-4">
        <Card>
          <CardHeader
            eyebrow="Channel"
            title="WhatsApp stock list"
            description="Text, shorthand or a voice note. Nikela returns a draft; the shop owner confirms."
            action={
              <Badge tone="brand">
                <MessageCircle aria-hidden className="size-3" />
                WhatsApp Business
              </Badge>
            }
          />
          <CardBody className="space-y-3">
            <div className="rounded-xl bg-brand-50/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                Sipho Ndlovu · Ndlovu General Dealer
              </p>
              <label htmlFor="stock-list" className="sr-only">
                Stock list
              </label>
              <textarea
                id="stock-list"
                value={rawList}
                onChange={(event) => setRawList(event.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-brand-100 bg-canvas px-3 py-2 text-[13.5px] leading-relaxed text-ink-900 outline-none focus-visible:border-brand-400"
                placeholder="20 maize meal 10kg, 15 oil 2L, 30 sugar 2kg"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleParse(rawList)}>
                <Sparkles aria-hidden className="size-4" />
                Create draft order
              </Button>
              <Button variant="secondary" onClick={handleVoiceNote}>
                <Mic aria-hidden className="size-4" />
                Use voice note
              </Button>
              {stage !== 'capture' ? (
                <Button variant="ghost" onClick={handleReset}>
                  Reset
                </Button>
              ) : null}
            </div>
            <p className="text-[12px] leading-relaxed text-ink-300">
              Free text never becomes an order on its own. Every line is matched with a confidence
              score, and low-confidence matches go to an agent instead of being guessed.
            </p>
          </CardBody>
        </Card>

        {parsed.length > 0 ? (
          <Card>
            <CardHeader
              eyebrow="Parsing"
              title="Matched lines"
              description="Confidence per line, exactly as the review queue sees it."
            />
            <CardBody className="space-y-2">
              {parsed.map((line) => (
                <div
                  key={line.raw}
                  className="flex items-start justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink-900">
                      {line.units} × {line.skuName}
                    </p>
                    <p className="truncate text-[11.5px] text-ink-300">Heard: “{line.raw}”</p>
                  </div>
                  {line.skuId === null ? (
                    <Badge tone="danger">
                      <AlertTriangle aria-hidden className="size-3" />
                      No match
                    </Badge>
                  ) : line.confidence < 0.7 ? (
                    <Badge tone="warn">
                      <UserCog aria-hidden className="size-3" />
                      Agent review
                    </Badge>
                  ) : (
                    <Badge tone="brand">{formatPercent(line.confidence, 0)} match</Badge>
                  )}
                </div>
              ))}
              {unmatched.length > 0 ? (
                <p className="rounded-lg bg-warn-50 px-3 py-2 text-[12px] leading-relaxed text-warn-500">
                  {unmatched.length} line(s) could not be matched to the ambient catalogue. They
                  stay in the agent queue and are excluded from the quote rather than substituted.
                </p>
              ) : null}
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardHeader
            eyebrow="Supplier choice"
            title="Multi-supplier by construction"
            description="Every cycle keeps a comparison supplier on record. No exclusivity."
          />
          <CardBody className="space-y-2">
            {suppliers.map((supplier) => (
              <label
                key={supplier.id}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
                  supplierId === supplier.id
                    ? 'border-brand-300 bg-brand-50/50'
                    : 'border-ink-100 hover:bg-surface'
                )}
              >
                <input
                  type="radio"
                  name="supplier"
                  value={supplier.id}
                  checked={supplierId === supplier.id}
                  onChange={() => setSupplierId(supplier.id)}
                  className="mt-0.5 accent-brand-500"
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-ink-900">
                    {supplier.name}
                  </span>
                  <span className="block text-[11.5px] leading-snug text-ink-500">
                    {supplier.note}
                  </span>
                </span>
              </label>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4">
        {stage === 'capture' ? (
          <Card>
            <CardBody className="py-10 text-center">
              <p className="text-[13.5px] font-medium text-ink-700">No draft order yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-500">
                Send a stock list to see the landed-cost comparison: supplier price, logistics fee,
                hub fee, platform fee and the verified saving before anything is confirmed.
              </p>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile
                label="Nikela landed cost"
                value={formatRand(quote.landedTotalCents)}
                hint="All fees included"
              />
              <StatTile
                label="Walk-in comparator"
                value={formatRand(quote.comparatorTotalCents)}
                hint="Local wholesaler, 3 Aug 2026"
              />
              <StatTile
                label="Verified saving"
                value={formatRand(quote.savingTotalCents)}
                hint={`${formatPercent(quote.savingRatio)} of comparator basket`}
                tone={quote.savingTotalCents >= 0 ? 'positive' : 'negative'}
              />
            </div>

            <Card>
              <CardHeader
                eyebrow={`Draft order${orderRef ? ` · ${orderRef}` : ''}`}
                title="Landed cost per line"
                description="The price tier is won by pooled cycle volume; the shop pays only for its own units."
                action={
                  <Badge tone={stage === 'confirmed' ? 'brand' : 'ochre'}>
                    {stage === 'confirmed' ? 'Confirmed' : 'Awaiting confirmation'}
                  </Badge>
                }
              />
              <CardBody className="space-y-3">
                {quote.lines.map((line) => (
                  <div key={line.skuId} className="rounded-xl border border-ink-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-ink-900">
                          {line.units} × {line.sku.name}{' '}
                          <span className="font-normal text-ink-500">{line.sku.packSize}</span>
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-ink-300">
                          {findSupplier(line.supplierId)?.name} · tier reached on {line.pooledUnits}{' '}
                          pooled units
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-[13.5px] font-semibold text-ink-900">
                        {formatCents(line.landedTotalCents)}
                      </p>
                    </div>

                    <dl className="tabular mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] sm:grid-cols-4">
                      <div>
                        <dt className="text-ink-300">Unit price</dt>
                        <dd className="font-medium text-ink-900">
                          {formatCents(line.appliedUnitPriceCents)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-300">Alone would pay</dt>
                        <dd className="font-medium text-ink-500">
                          {formatCents(line.walkInUnitPriceCents)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-300">Walk-in retail</dt>
                        <dd className="font-medium text-ink-500">
                          {formatCents(line.sku.comparator.unitPriceCents)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-300">Line saving</dt>
                        <dd
                          className={cn(
                            'font-semibold',
                            line.savingCents >= 0 ? 'text-brand-600' : 'text-danger-500'
                          )}
                        >
                          {formatCents(line.savingCents, { showSign: true })}
                        </dd>
                      </div>
                    </dl>

                    {line.nextTier ? (
                      <div className="mt-2.5">
                        <div className="mb-1 flex items-center justify-between text-[11.5px] text-ink-500">
                          <span>
                            {line.nextTier.unitsNeeded} more pooled units unlock{' '}
                            {formatCents(line.nextTier.unitPriceCents)} per unit
                          </span>
                        </div>
                        <ProgressBar
                          ratio={line.pooledUnits / (line.pooledUnits + line.nextTier.unitsNeeded)}
                          tone="ochre"
                          label="Progress to next price tier"
                        />
                      </div>
                    ) : (
                      <p className="mt-2.5 text-[11.5px] font-medium text-brand-600">
                        Best available tier reached for this cycle.
                      </p>
                    )}
                  </div>
                ))}
              </CardBody>
              <CardFooter>
                <div className="space-y-0.5">
                  <MoneyLine
                    label="Supplier price"
                    amountCents={quote.supplierTotalCents}
                    note="Negotiated tier on pooled volume"
                  />
                  <MoneyLine
                    label="Logistics fee"
                    amountCents={quote.logisticsTotalCents}
                    note={`${zone?.serviceWindow ?? 'Scheduled window'} · hub collection default`}
                  />
                  <MoneyLine
                    label="Hub handling fee"
                    amountCents={quote.hubTotalCents}
                    note="Charged only on verified handover"
                  />
                  <MoneyLine
                    label="Platform coordination fee"
                    amountCents={quote.platformTotalCents}
                    note="2.5% of supplier price, disclosed separately"
                  />
                  <MoneyLine
                    label="Total landed cost"
                    amountCents={quote.landedTotalCents}
                    emphasis="total"
                  />
                </div>
              </CardFooter>
            </Card>

            {stage === 'confirmed' && orderRef ? (
              <Card className="border-brand-200">
                <CardHeader
                  eyebrow="Confirmation sent"
                  title={`Order ${orderRef} joined the ${currentCycle.groupName}`}
                  action={
                    <Badge tone="brand">
                      <CheckCircle2 aria-hidden className="size-3" />
                      Pooled
                    </Badge>
                  }
                />
                <CardBody className="space-y-3">
                  <div className="rounded-xl bg-brand-50/60 p-3 text-[13px] leading-relaxed text-ink-700">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                      WhatsApp message queued
                    </p>
                    <p>
                      Order <span className="font-semibold">{orderRef}</span> confirmed. Landed cost{' '}
                      {formatCents(quote.landedTotalCents)}, saving{' '}
                      {formatCents(quote.savingTotalCents)} against your walk-in price. Collection
                      at Sibongile Spaza — Site C, {zone?.serviceWindow}. Cycle locks{' '}
                      {currentCycle.locksAt}. Reply <span className="font-semibold">H</span> for
                      help.
                    </p>
                  </div>
                  <p className="text-[12px] leading-relaxed text-ink-500">
                    The same order reference now exists in the ops order desk, the consolidated
                    purchase order, the hub scan list and the invoice. Payment must settle before
                    cycle lock for the order to be included.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardHeader
                  eyebrow="Explicit confirmation"
                  title="Nothing is ordered until the owner agrees"
                  description="Confirmation records the message that authorised it, and the quoted price becomes a ceiling."
                />
                <CardBody className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleConfirm} disabled={quote.lines.length === 0}>
                    Confirm order ({formatRand(quote.landedTotalCents)})
                  </Button>
                  <Button variant="secondary">Adjust quantities</Button>
                  <Button variant="ghost">Talk to an agent</Button>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
