// action.ts
"use server"

type Farm = {
  id: number
  name: string
  address: string
  additionalInfo: Record<string, string>
}

let farms: Farm[] = []

export async function listFarms(): Promise<Farm[]> {
  return farms
}

export async function createFarm(data: {
  name: string
  address: string
  additionalInfo: Record<string, string>
}) {

  const maxId = farms.length ? Math.max(...farms.map(f => f.id)) : 0
  const newFarm: Farm = {
    id: maxId + 1,
    ...data,
  }

  farms.push(newFarm)

  return newFarm
}