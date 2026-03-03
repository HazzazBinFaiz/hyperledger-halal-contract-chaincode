import Link from "next/link"
import { getAllBatches, getAllProcessedBatches } from "@/lib/actions/batch"
import { listFarms } from "@/lib/actions/farm"
import { listSlaughterHouses } from "@/lib/actions/slaughter-house"
import { listRetailShop } from "@/lib/actions/retail-shop"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatCard = {
  label: string
  value: number
  href: string
}

const batchStatusRoute: Record<string, string> = {
  CREATED: "/batch/move/dispatch",
  WAITING_FOR_TRANSPORT: "/batch/move/accept-transport",
  IN_TRANSPORT: "/batch/move/deliver",
  DELIVERED_TO_SLAUGHTERHOUSE: "/batch/move/accept-slaughter",
  SLAUGHTERING: "/batch/move/process",
  PROCESSED: "/batch/processed",
  REJECTED: "/batch",
}

const unitStatusRoute: Record<string, string> = {
  CREATED: "/batch/move/processed/dispatch",
  WAITING_FOR_FROZEN_TRANSPORT: "/batch/move/processed/accept-frozen-transport",
  IN_FROZEN_TRANSPORT: "/batch/move/processed/deliver-retail",
  DELIVERED_TO_RETAIL: "/batch/move/processed/on-sale",
  ON_SALE: "/batch/move/processed/sell",
  SOLD: "/batch/processed",
  REJECTED: "/batch/processed",
}

function countByStatus<T extends { status: string }>(rows: T[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    return acc
  }, {})
}

export default async function Page() {
  const [batches, units, farms, slaughterHouses, retailShops] = await Promise.all([
    getAllBatches(),
    getAllProcessedBatches(),
    listFarms(),
    listSlaughterHouses(),
    listRetailShop(),
  ])

  const batchStatusCount = countByStatus(batches)
  const unitStatusCount = countByStatus(units)

  const totalChickenInBatches = batches.reduce((sum, batch) => sum + Number(batch.number_of_chicken || 0), 0)
  const totalProcessedUnits = batches.reduce((sum, batch) => sum + Number(batch.number_of_processed_units || 0), 0)
  const soldUnits = unitStatusCount.SOLD ?? 0
  const onSaleUnits = unitStatusCount.ON_SALE ?? 0

  const cards: StatCard[] = [
    { label: "Farms", value: farms.length, href: "/farms" },
    { label: "Slaughter Houses", value: slaughterHouses.length, href: "/slaughter-house" },
    { label: "Retail Shops", value: retailShops.length, href: "/retail-shop" },
    { label: "Batches", value: batches.length, href: "/batch" },
    { label: "Processed Units", value: units.length, href: "/batch/processed" },
    { label: "In Transport Batches", value: batchStatusCount.IN_TRANSPORT ?? 0, href: "/batch/move/iot" },
    { label: "Frozen Transport Units", value: unitStatusCount.IN_FROZEN_TRANSPORT ?? 0, href: "/batch/move/processed/iot" },
    { label: "Sold Units", value: soldUnits, href: "/batch/move/processed/sell" },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="h-full border-slate-200 transition hover:border-slate-300 hover:shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Batch Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.keys(batchStatusCount).length === 0 ? (
              <p className="text-muted-foreground">No batch data</p>
            ) : (
              Object.entries(batchStatusCount)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    {batchStatusRoute[status] ? (
                      <Link href={batchStatusRoute[status]} className="font-medium text-slate-700 underline-offset-4 hover:underline">
                        {status}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-700">{status}</span>
                    )}
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processed Unit Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.keys(unitStatusCount).length === 0 ? (
              <p className="text-muted-foreground">No processed unit data</p>
            ) : (
              Object.entries(unitStatusCount)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    {unitStatusRoute[status] ? (
                      <Link href={unitStatusRoute[status]} className="font-medium text-slate-700 underline-offset-4 hover:underline">
                        {status}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-700">{status}</span>
                    )}
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production KPIs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="font-medium text-slate-700">Total Chicken Count</span>
              <span className="font-semibold text-slate-900">{totalChickenInBatches}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="font-medium text-slate-700">Produced Units (from batches)</span>
              <span className="font-semibold text-slate-900">{totalProcessedUnits}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="font-medium text-slate-700">Units On Sale</span>
              <span className="font-semibold text-slate-900">{onSaleUnits}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="font-medium text-slate-700">Units Sold</span>
              <span className="font-semibold text-slate-900">{soldUnits}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2">
              <span className="font-medium text-emerald-800">Sell Through Rate</span>
              <span className="font-semibold text-emerald-900">
                {units.length ? `${((soldUnits / units.length) * 100).toFixed(1)}%` : "0.0%"}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
