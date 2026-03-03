export type StorageProvider = "local" | "s3" | "minio"

export type StorageConfig = {
  provider: StorageProvider
  localBasePath: string
  s3Bucket?: string
  s3Endpoint?: string
}

export const defaultStorageConfig: StorageConfig = {
  provider: "local",
  localBasePath: "/uploads",
  s3Bucket: "",
  s3Endpoint: "",
}

export const storageConfigKey = "halal_storage_config_v1"
