export type StorageProvider = "local" | "s3" | "minio"

export type StorageConfig = {
  provider: StorageProvider
  localBasePath: string
  bucket?: string
  region?: string
  endpoint?: string
  accessKeyId?: string
  secretAccessKey?: string
  forcePathStyle?: boolean
  publicBaseUrl?: string
}

export const defaultStorageConfig: StorageConfig = {
  provider: "local",
  localBasePath: "/uploads",
  bucket: "",
  region: "us-east-1",
  endpoint: "",
  accessKeyId: "",
  secretAccessKey: "",
  forcePathStyle: true,
  publicBaseUrl: "",
}
