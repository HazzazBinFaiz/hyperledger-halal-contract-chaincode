import { NextResponse } from "next/server"
import { defaultStorageConfig, StorageConfig } from "@/lib/storage-config"
import { readStorageConfig, writeStorageConfig } from "@/lib/server/storage-config"

export const runtime = "nodejs"

export async function GET() {
  const config = await readStorageConfig()
  return NextResponse.json(config)
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<StorageConfig>

  const nextConfig: StorageConfig = {
    ...defaultStorageConfig,
    ...body,
  }

  const saved = await writeStorageConfig(nextConfig)
  return NextResponse.json(saved)
}
