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

const utf8Decoder = new TextDecoder()
const contract = await getContract();

export async function listFarms(): Promise<Farm[]> {
    const resultBytes = await contract.evaluateTransaction('getAllFarmers');
    return JSON.parse(utf8Decoder.decode(resultBytes)) as Farm[]
}

export async function createFarm(data: {
    name: string
    address: string
    extra_info: Record<string, string>
}) {
    const result = await listFarms()
    const maxId = result.length ? Math.max(...result.map(b => b.id)) : 0
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
