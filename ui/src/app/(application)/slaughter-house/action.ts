// action.ts
"use server"

export type SlaughterHouse = {
  id: number
  name: string
  address: string
  additionalInfo: Record<string, string>
}

let slaughterHouses: SlaughterHouse[] = []

export async function listSlaughterHouses(): Promise<SlaughterHouse[]> {
  return slaughterHouses
}

export async function createSlaughterHouses(data: {
  name: string
  address: string
  additionalInfo: Record<string, string>
}) {

  const maxId = slaughterHouses.length ? Math.max(...slaughterHouses.map(f => f.id)) : 0
  const newFarm: SlaughterHouse = {
    id: maxId + 1,
    ...data,
  }

  slaughterHouses.push(newFarm)

  return newFarm
}