import { NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import { extname, join } from "node:path"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { readStorageConfig } from "@/lib/server/storage-config"

export const runtime = "nodejs"

function getPublicPath(basePath: string, fileName: string) {
  const normalized = basePath.startsWith("/") ? basePath.slice(1) : basePath
  return `/${normalized}/${fileName}`
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const hash = String(formData.get("hash") || "").trim()

  if (!file || !hash) {
    return NextResponse.json({ error: "file and hash required" }, { status: 400 })
  }

  const config = await readStorageConfig()
  const fileExt = extname(file.name) || ".bin"
  const fileName = `${hash}${fileExt}`
  const mimeType = file.type || "application/octet-stream"
  const bytes = Buffer.from(await file.arrayBuffer())

  if (config.provider === "local") {
    const relativeBasePath = config.localBasePath.startsWith("/") ? config.localBasePath.slice(1) : config.localBasePath
    const targetDir = join(process.cwd(), "public", relativeBasePath)
    await mkdir(targetDir, { recursive: true })
    await writeFile(join(targetDir, fileName), bytes)

    return NextResponse.json({
      hash,
      provider: config.provider,
      filename: fileName,
      mimetype: mimeType,
      path: getPublicPath(config.localBasePath, fileName),
    })
  }

  const missing = ["bucket", "region", "accessKeyId", "secretAccessKey"]
    .filter((key) => !config[key as keyof typeof config])

  if (missing.length) {
    return NextResponse.json({ error: `Missing storage config: ${missing.join(", ")}` }, { status: 400 })
  }

  const s3Client = new S3Client({
    region: config.region,
    endpoint: config.endpoint || undefined,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId!,
      secretAccessKey: config.secretAccessKey!,
    },
  })

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: fileName,
      Body: bytes,
      ContentType: mimeType,
    })
  )

  const defaultS3Url = config.endpoint
    ? `${config.endpoint.replace(/\/$/, "")}/${config.bucket}/${fileName}`
    : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${fileName}`

  return NextResponse.json({
    hash,
    provider: config.provider,
    filename: fileName,
    mimetype: mimeType,
    path: config.publicBaseUrl
      ? `${config.publicBaseUrl.replace(/\/$/, "")}/${fileName}`
      : defaultS3Url,
  })
}
