import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { defaultStorageConfig, StorageConfig } from "@/lib/storage-config"

const storageConfigFile = join(process.cwd(), "storage", "storage-config.json")

export async function readStorageConfig(): Promise<StorageConfig> {
  try {
    const raw = await readFile(storageConfigFile, "utf8")
    return { ...defaultStorageConfig, ...JSON.parse(raw) } as StorageConfig
  } catch {
    return { ...defaultStorageConfig }
  }
}

export async function writeStorageConfig(config: StorageConfig): Promise<StorageConfig> {
  const merged = { ...defaultStorageConfig, ...config }
  await mkdir(dirname(storageConfigFile), { recursive: true })
  await writeFile(storageConfigFile, JSON.stringify(merged, null, 2), "utf8")
  return merged
}
