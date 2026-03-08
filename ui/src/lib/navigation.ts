export type NavItem = {
  title: string
  url: string
}

export type NavSection = {
  title: string
  url: string
  items?: NavItem[]
}

export const navMain: NavSection[] = [
  { title: "Dashboard", url: "/" },
  { title: "Notifications", url: "/notifications" },
  {
    title: "Organizations",
    url: "#",
    items: [
      { title: "Farm", url: "/farms" },
      { title: "Slaughter House", url: "/slaughter-house" },
      { title: "Retail Shop", url: "/retail-shop" },
    ],
  },
  {
    title: "Settings",
    url: "#",
    items: [{ title: "Storage Config", url: "/settings/storage" }],
  },
  {
    title: "Batch",
    url: "#",
    items: [
      { title: "Create Batch", url: "/batch/create" },
      { title: "List Batches", url: "/batch" },
      { title: "Dispatch Batch", url: "/batch/move/dispatch" },
      { title: "Accept Transport Batch", url: "/batch/move/accept-transport" },
      { title: "Add IoT Trace", url: "/batch/move/iot" },
      { title: "Deliver Batch", url: "/batch/move/deliver" },
      { title: "Accept for Slaughtering", url: "/batch/move/accept-slaughter" },
      { title: "Process Batch", url: "/batch/move/process" },
      { title: "Trace Batch", url: "/batch/trace" },
    ],
  },
  {
    title: "Processed Batch",
    url: "#",
    items: [
      { title: "List Processed Batches", url: "/batch/processed" },
      { title: "Dispatch Frozen", url: "/batch/move/processed/dispatch" },
      { title: "Accept Frozen", url: "/batch/move/processed/accept-frozen-transport" },
      { title: "Add IoT Trace", url: "/batch/move/processed/iot" },
      { title: "Deliver Retail", url: "/batch/move/processed/deliver-retail" },
      { title: "Put On Sale", url: "/batch/move/processed/on-sale" },
      { title: "Mark Sold", url: "/batch/move/processed/sell" },
      { title: "Trace Processed Batch", url: "/batch/processed/trace" },
    ],
  },
  { title: "Trace By QR", url: "/trace-by-qr" },
]

export function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/"
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

export function findMenuTrail(pathname: string) {
  const path = normalizePath(pathname)

  let bestSection: NavSection | null = null
  let bestItem: NavItem | null = null
  let bestLen = -1

  for (const section of navMain) {
    if (!section.items?.length) {
      const sectionPath = normalizePath(section.url)
      if (sectionPath === path || path.startsWith(`${sectionPath}/`)) {
        if (sectionPath.length > bestLen) {
          bestSection = section
          bestItem = null
          bestLen = sectionPath.length
        }
      }
      continue
    }

    for (const item of section.items) {
      const itemPath = normalizePath(item.url)
      const exact = itemPath === path
      const prefix = path.startsWith(`${itemPath}/`)
      if (!exact && !prefix) continue

      if (itemPath.length > bestLen) {
        bestSection = section
        bestItem = item
        bestLen = itemPath.length
      }
    }
  }

  return { section: bestSection, item: bestItem }
}
