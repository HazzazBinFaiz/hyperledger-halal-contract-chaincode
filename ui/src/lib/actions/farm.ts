// action.ts
"use server"

import {getContract} from "@/lib/gateway";
import {TextDecoder} from "node:util";

export type Farm = {
  id: number
  name: string
  address: string
  extra_info: Record<string, string>
}

let farms: Farm[] = []
const utf8Decoder = new TextDecoder()
const contract = await getContract();

export async function listFarms(): Promise<Farm[]> {
  const resultBytes = await contract.evaluateTransaction('getAllFarmers');
  const result = JSON.parse(utf8Decoder.decode(resultBytes)) as Farm[];
  farms = result;
  return result
}

export async function createFarm(data: {
  name: string
  address: string
  extra_info: Record<string, string>
}) {

  const maxId = farms.length ? Math.max(...farms.map(f => f.id)) : 0
  const newFarm: Farm = {
    id: maxId + 1,
    ...data,
  }

    await contract.submitTransaction(
        'createFarmer',
        (maxId + 1).toString(),
        data.name.toString(),
        data.address.toString(),
        JSON.stringify(data.extra_info)
    )

  return newFarm
}
