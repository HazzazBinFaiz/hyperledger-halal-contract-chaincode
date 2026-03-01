// action.ts
"use server"

import {getContract} from "@/lib/gateway";
import {TextDecoder} from "node:util";

export type RetailShop = {
    id: number
    name: string
    address: string
    extra_info: Record<string, string>
}


const utf8Decoder = new TextDecoder()
const contract = await getContract();

export async function listRetailShop(): Promise<RetailShop[]> {
    const resultBytes = await contract.evaluateTransaction('getAllRetailShops');
    return JSON.parse(utf8Decoder.decode(resultBytes)) as RetailShop[]
}

export async function createRetailShop(data: {
    name: string
    address: string
    extra_info: Record<string, string>
}) {
    const result = await listRetailShop()
    const maxId = result.length ? Math.max(...result.map(b => b.id)) : 0
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
