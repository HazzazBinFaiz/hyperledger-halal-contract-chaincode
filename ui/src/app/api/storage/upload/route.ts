import { NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import { extname, join } from "node:path"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const hash = String(formData.get("hash") || "").trim()
  const provider = String(formData.get("provider") || "local").trim()
  const localBasePath = String(formData.get("localBasePath") || "/uploads").trim()

  if (!file || !hash) {
    return NextResponse.json({ error: "file and hash required" }, { status: 400 })
  }

  if (provider !== "local") {
    return NextResponse.json({ error: `provider ${provider} is not wired on server yet` }, { status: 400 })
  }

  const fileExt = extname(file.name) || ".bin"
  const fileName = `${hash}${fileExt}`

  const relativeBasePath = localBasePath.startsWith("/") ? localBasePath.slice(1) : localBasePath
  const targetDir = join(process.cwd(), "public", relativeBasePath)
  await mkdir(targetDir, { recursive: true })

  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(join(targetDir, fileName), bytes)

  return NextResponse.json({
    hash,
    provider,
    filename: fileName,
    mimetype: file.type || "application/octet-stream",
    path: `/${relativeBasePath}/${fileName}`,
  })
}
