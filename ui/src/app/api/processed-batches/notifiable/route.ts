import { NextResponse } from "next/server"
import { getNotifiableProcessedBatches } from "@/lib/actions/batch"

const DEFAULT_WARN_MINUTES = 24 * 60

export async function GET() {
  try {
    const envValue = Number.parseInt(process.env.WARN_ME_BEFORE_MINUTES ?? "", 10)
    const warnMinutes = Number.isFinite(envValue) && envValue > 0 ? envValue : DEFAULT_WARN_MINUTES
    const units = await getNotifiableProcessedBatches(warnMinutes)

    return NextResponse.json({
      warn_minutes: warnMinutes,
      units,
    })
  } catch (error) {
    console.error("Failed to fetch notifiable processed batches", error)
    return NextResponse.json(
      { error: "Failed to fetch notifiable processed batches", units: [] },
      { status: 500 }
    )
  }
}
