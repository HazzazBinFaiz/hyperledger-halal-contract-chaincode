// action.ts
"use server"

import {getContract} from "@/lib/gateway";
import {TextDecoder} from "node:util";
import {Farm} from "@/lib/actions/farm";

export type RetailShop = {
  id: number
  name: string
  address: string
  extra_info: Record<string, string>
}

let retailShops: RetailShop[] = []
const utf8Decoder = new TextDecoder()
const contract = await getContract();

export async function listRetailShop(): Promise<RetailShop[]> {
    const resultBytes = await contract.evaluateTransaction('getAllRetailShops');
    const result = JSON.parse(utf8Decoder.decode(resultBytes)) as RetailShop[];
    retailShops = result;
    return result
}

export async function createRetailShop(data: {
  name: string
  address: string
  extra_info: Record<string, string>
}) {

  const maxId = retailShops.length ? Math.max(...retailShops.map(f => f.id)) : 0
  const newRetailShop: RetailShop = {
    id: maxId + 1,
    ...data,
  }

    await contract.submitTransaction(
        'createRetailShop',
        (maxId + 1).toString(),
        data.name.toString(),
        data.address.toString(),
        JSON.stringify(data.extra_info)
    )

  return newRetailShop
}
