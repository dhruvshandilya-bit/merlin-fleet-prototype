import { useState } from 'react'
import { Fuel, Receipt, Truck, MapPin, CreditCard } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card, Table, Th, Td, Tr, Badge, Tabs, Metric, MetricRow } from '@/components/ui'
import { currency, num, formatDate } from '@/lib/utils'
import { PageHead } from '@/features/vehicles/VehiclesScreen'

const FLEET_MILES = 15230

export function FuelScreen() {
  const { fuel, tolls, truckById, driverById } = useStore()
  const [tab, setTab] = useState('fuel')

  const fuelSpend = fuel.reduce((s, t) => s + t.amount, 0)
  const totalGallons = fuel.reduce((s, t) => s + t.gallons, 0)
  const tollSpend = tolls.reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-4">
      <PageHead
        title="Fuel & Tolls"
        sub="Card & transponder transaction ledger — reconciled to trucks & drivers"
      />

      <MetricRow cols={5}>
        <Metric
          label="Fuel Spend"
          value={currency(fuelSpend)}
          info="Total diesel purchases this period."
        />
        <Metric
          label="Gallons"
          value={`${num(totalGallons)} gal`}
          info="Total gallons purchased."
        />
        <Metric
          label="Avg $/gal"
          value={`$${(fuelSpend / totalGallons).toFixed(2)}`}
          info="Blended price per gallon."
        />
        <Metric
          label="Toll Spend"
          value={currency(tollSpend)}
          info="Toll & transponder charges."
        />
        <Metric
          label="Cost / Mile"
          value={`$${((fuelSpend + tollSpend) / FLEET_MILES).toFixed(2)}`}
          info="Fuel + tolls ÷ total fleet miles this period (15,230 mi)."
        />
      </MetricRow>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'fuel', label: 'Fuel', count: fuel.length },
          { key: 'tolls', label: 'Tolls', count: tolls.length },
        ]}
      />

      {tab === 'fuel' && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Truck</Th>
                <Th>Driver</Th>
                <Th>Location</Th>
                <Th>State</Th>
                <Th className="text-right">Gallons</Th>
                <Th className="text-right">$/gal</Th>
                <Th className="text-right">Amount</Th>
                <Th>Card</Th>
              </tr>
            </thead>
            <tbody>
              {fuel.map((t) => {
                const driver = driverById(t.driverId)
                return (
                  <Tr key={t.id}>
                    <Td>{formatDate(t.date)}</Td>
                    <Td className="font-medium">
                      <span className="flex items-center gap-1.5">
                        <Truck size={13} className="text-icon-soft-400" />#{truckById(t.truckId)?.unitNumber}
                      </span>
                    </Td>
                    <Td>{driver?.name ?? <span className="text-text-soft-400">—</span>}</Td>
                    <Td>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-icon-soft-400" />{t.location}
                      </span>
                    </Td>
                    <Td><Badge tone="slate">{t.state}</Badge></Td>
                    <Td className="text-right tabular-nums">{num(t.gallons)}</Td>
                    <Td className="text-right tabular-nums">${t.pricePerGal.toFixed(2)}</Td>
                    <Td className="text-right font-semibold tabular-nums">{currency(t.amount)}</Td>
                    <Td className="text-text-soft-400">
                      <span className="flex items-center gap-1.5">
                        <CreditCard size={13} />••{t.cardLast4}
                      </span>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <Td className="font-semibold text-text-strong-950" >Total</Td>
                <Td /><Td /><Td /><Td />
                <Td className="text-right font-semibold tabular-nums">{num(totalGallons)}</Td>
                <Td />
                <Td className="text-right font-semibold tabular-nums">{currency(fuelSpend)}</Td>
                <Td />
              </tr>
            </tfoot>
          </Table>
        </Card>
      )}

      {tab === 'tolls' && (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Truck</Th>
                <Th>Location</Th>
                <Th>State</Th>
                <Th>Transponder</Th>
                <Th className="text-right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {tolls.map((t) => (
                <Tr key={t.id}>
                  <Td>{formatDate(t.date)}</Td>
                  <Td className="font-medium">
                    <span className="flex items-center gap-1.5">
                      <Truck size={13} className="text-icon-soft-400" />#{truckById(t.truckId)?.unitNumber}
                    </span>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-icon-soft-400" />{t.location}
                    </span>
                  </Td>
                  <Td><Badge tone="slate">{t.state}</Badge></Td>
                  <Td className="text-text-sub-600">
                    <span className="flex items-center gap-1.5">
                      <Receipt size={13} className="text-icon-soft-400" />{t.transponder}
                    </span>
                  </Td>
                  <Td className="text-right font-semibold tabular-nums">{currency(t.amount)}</Td>
                </Tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <Td className="font-semibold text-text-strong-950">Total</Td>
                <Td /><Td /><Td /><Td />
                <Td className="text-right font-semibold tabular-nums">{currency(tollSpend)}</Td>
              </tr>
            </tfoot>
          </Table>
        </Card>
      )}
    </div>
  )
}
