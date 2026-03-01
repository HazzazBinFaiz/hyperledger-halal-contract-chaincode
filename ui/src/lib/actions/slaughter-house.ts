// action.ts
"use server"

import {getContract} from "@/lib/gateway";
import {TextDecoder} from "node:util";
import {Farm} from "@/lib/actions/farm";

export type SlaughterHouse = {
    id: number
    name: string
    address: string
    extra_info: Record<string, string>
}

const utf8Decoder = new TextDecoder()
const contract = await getContract();

export async function listSlaughterHouses(): Promise<SlaughterHouse[]> {
    const resultBytes = await contract.evaluateTransaction('getAllSlaughterHouses');
    return JSON.parse(utf8Decoder.decode(resultBytes)) as Farm[]
}

export async function createSlaughterHouses(data: {
    name: string
    address: string
    extra_info: Record<string, string>
}) {
    const result = await listSlaughterHouses()
    const maxId = result.length ? Math.max(...result.map(b => b.id)) : 0
    const newFarm: SlaughterHouse = {
        id: maxId + 1,
        ...data,
    }

    await contract.submitTransaction(
        'createSlaughteringHouse',
        (maxId + 1).toString(),
        data.name.toString(),
        data.address.toString(),
        JSON.stringify(data.extra_info)
    )

    return newFarm
}
