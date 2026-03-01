"use server"

import {TextDecoder} from "node:util";
import {getContract} from "@/lib/gateway";

export type PoultryBatch = {
  id: number
  farm_id: number
  slaughter_house_id: number | null
  status: string
  created_at: string
  number_of_chicken: number
  age_of_chicken: number
  breed_type: string
  ideal_temperature: number
  number_of_processed_units: number
  extra_info: Record<string, string>
}

const utf8Decoder = new TextDecoder()
const contract = await getContract();

export async function getAllBatches(): Promise<PoultryBatch[]> {
    const resultBytes = await contract.evaluateTransaction('getAllBatches');
    return JSON.parse(utf8Decoder.decode(resultBytes)) as PoultryBatch[]
}

export async function getAllBatchesByStatus(status: string): Promise<PoultryBatch[]> {
    const resultBytes = await contract.evaluateTransaction('getBatchesByStatus', status);
    return JSON.parse(utf8Decoder.decode(resultBytes)) as PoultryBatch[];
}

export async function createPoultryBatch(data: {
  farm_id: number
  add_date: string
  age_of_chicken: number
  breed_type: string
  ideal_temperature: number
  extra_info: Record<string, string>
}) {
    const result = await getAllBatches()
    const maxId = result.length ? Math.max(...result.map(b => b.id)) : 0

  const batch: PoultryBatch = {
    id: maxId + 1,
    farm_id: data.farm_id,
    slaughter_house_id: null,
    status: "CREATED",
    created_at: data.add_date,
    number_of_chicken: 0,
    age_of_chicken: data.age_of_chicken,
    breed_type: data.breed_type,
    ideal_temperature: data.ideal_temperature,
    number_of_processed_units: 0,
    extra_info: data.extra_info,
  };

    await contract.submitTransaction(
        'createPoultryBatch',
        (maxId + 1).toString(),
        data.farm_id.toString(),
        data.add_date,
        data.age_of_chicken.toString(),
        data.breed_type.toString(),
        data.ideal_temperature.toString(),
        JSON.stringify(data.extra_info),
    )
  return batch
}

export async function dispatchBatchToTransport(batch_id, dispatch_time, number_of_chicken, room_temperature, extra_info) {
    await contract.submitTransaction(
        'dispatchBatchToTransport',
        batch_id.toString(),
        dispatch_time.toString(),
        number_of_chicken.toString(),
        room_temperature.toString(),
        JSON.stringify(extra_info),
    )
}

export async function acceptBatchForTransport(
    batch_id: number,
    acceptance_time: string,
    number_of_chicken: number,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'acceptBatchForTransport',
        batch_id.toString(),
        acceptance_time,
        number_of_chicken.toString(),
        JSON.stringify(extra_info)
    )
}

export async function deliverBatch(
    batch_id: number,
    slaughter_house_id: number,
    delivery_time: string,
    number_of_chicken: number,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'deliverBatch',
        batch_id.toString(),
        slaughter_house_id.toString(),
        delivery_time,
        number_of_chicken.toString(),
        JSON.stringify(extra_info)
    )
}

export async function acceptBatchForSlaughtering(
    batch_id: number,
    slaughter_house_id: number,
    acceptance_time: string,
    number_of_chicken: number,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'acceptBatchForSlaughtering',
        batch_id.toString(),
        slaughter_house_id.toString(),
        acceptance_time,
        number_of_chicken.toString(),
        JSON.stringify(extra_info)
    )
}

export async function createProcessedBatch(
    batch_id: number,
    number_of_split_batches: number,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'createProcessedBatch',
        batch_id.toString(),
        number_of_split_batches.toString(),
        JSON.stringify(extra_info)
    )
}

export async function rejectBatch(
    batch_id: number,
    reason: string,
    actor_id: number
) {
    await contract.submitTransaction(
        'rejectBatch',
        batch_id.toString(),
        reason,
        actor_id.toString()
    )
}

export async function recallBatch(
    batch_id: number,
    reason: string,
    authority_id: number
) {
    await contract.submitTransaction(
        'recallBatch',
        batch_id.toString(),
        reason,
        authority_id.toString()
    )
}
