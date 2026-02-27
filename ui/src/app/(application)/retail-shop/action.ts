// action.ts
"use server"

export type RetailShop = {
  id: number
  name: string
  address: string
  additionalInfo: Record<string, string>
}

let retailShops: RetailShop[] = []

export async function listRetailShop(): Promise<RetailShop[]> {
  return retailShops
}

export async function createRetailShop(data: {
  name: string
  address: string
  additionalInfo: Record<string, string>
}) {

  const maxId = retailShops.length ? Math.max(...retailShops.map(f => f.id)) : 0
  const newRetailShop: RetailShop = {
    id: maxId + 1,
    ...data,
  }

  retailShops.push(newRetailShop)

  return newRetailShop
}