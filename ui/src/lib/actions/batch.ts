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

export type ProcessedBatch = {
    original_batch_id: number
    unit_id: number
    status: string
    created_at: string
    weight: number
    retail_shop_id?: number
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
        data.add_date.toString(),
        data.age_of_chicken.toString(),
        data.breed_type.toString(),
        data.ideal_temperature.toString(),
        JSON.stringify(data.extra_info),
    );
  return batch
}

export async function dispatchBatchToTransport(batch_id: number, dispatch_time: string, number_of_chicken: string, room_temperature: string, extra_info: Record<string, string>) {
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

export async function getProcessedBatchById(unit_id: number): Promise<ProcessedBatch | null> {
    const resultBytes = await contract.evaluateTransaction('getProcessedBatchById', unit_id.toString())
    try {
        return JSON.parse(utf8Decoder.decode(resultBytes)) as ProcessedBatch | null
    } catch (error) {
        return null;
    }
}

export async function getAllProcessedBatches(): Promise<ProcessedBatch[]> {
    const resultBytes = await contract.evaluateTransaction('getAllProcessedBatches')
    return JSON.parse(utf8Decoder.decode(resultBytes)) as ProcessedBatch[]
}

export async function getProcessedBatchesByStatus(status: string): Promise<ProcessedBatch[]> {
    const units = await getAllProcessedBatches()
    return units.filter((unit) => unit.status === status)
}

export async function getProcessedBatchesByBatchId(batch_id: number): Promise<ProcessedBatch[]> {
    const units = await getAllProcessedBatches()
    return units.filter((unit) => unit.original_batch_id === batch_id)
}

export async function dispatchProcessedBatchToFrozenTransport(
    unit_id: number,
    dispatch_time: string,
    room_temperature: number,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'dispatchProcessedBatchToFrozenTransport',
        unit_id.toString(),
        dispatch_time,
        room_temperature.toString(),
        JSON.stringify(extra_info)
    )
}

export async function acceptProcessedBatchForFrozenTransport(
    unit_id: number,
    acceptance_time: string,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'acceptProcessedBatchForFrozenTransport',
        unit_id.toString(),
        acceptance_time,
        JSON.stringify(extra_info)
    )
}

export async function deliverProcessedBatchToRetail(
    unit_id: number,
    retail_shop_id: number,
    delivery_time: string,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'deliverProcessedBatchToRetail',
        unit_id.toString(),
        retail_shop_id.toString(),
        delivery_time,
        JSON.stringify(extra_info)
    )
}

export async function putProcessedBatchOnSale(
    unit_id: number,
    sale_time: string,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'putProcessedBatchOnSale',
        unit_id.toString(),
        sale_time,
        JSON.stringify(extra_info)
    )
}

export async function sellProcessedBatch(
    unit_id: number,
    sold_time: string,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'sellProcessedBatch',
        unit_id.toString(),
        sold_time,
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


export type PoultryBatchTrace = {
    batch_id: number
    unit_id: number
    datetime: string
    actor_id: number
    action_code?: string
    action: string
    action_message?: string
    action_tag?: string
    extra_info: Record<string, string | number | boolean>
}

export async function getTraceOfBatch(batch_id: number): Promise<PoultryBatchTrace[]> {
    const resultBytes = await contract.evaluateTransaction('queryTraceOfBatch', batch_id.toString())
    return JSON.parse(utf8Decoder.decode(resultBytes)) as PoultryBatchTrace[]
}

export async function getTraceOfBatchPaginated(
    batch_id: number,
    page_size: number,
    bookmark = ''
): Promise<{ records: PoultryBatchTrace[]; bookmark: string; fetched_records_count: number }> {
    const resultBytes = await contract.evaluateTransaction(
        'queryTraceOfBatchPaginated',
        batch_id.toString(),
        page_size.toString(),
        bookmark
    )
    return JSON.parse(utf8Decoder.decode(resultBytes)) as { records: PoultryBatchTrace[]; bookmark: string; fetched_records_count: number }
}

export async function getBatchById(batch_id: number): Promise<PoultryBatch | null> {
    const resultBytes = await contract.evaluateTransaction('getBatchById', batch_id.toString())
    return JSON.parse(utf8Decoder.decode(resultBytes)) as PoultryBatch | null
}

export async function getTraceOfProcessedBatch(unit_id: number): Promise<PoultryBatchTrace[]> {
    const unit = await getProcessedBatchById(unit_id)
    if (!unit) return []

    const traces = await getTraceOfBatch(unit.original_batch_id)
    return traces.filter((trace) => trace.unit_id === 0 || trace.unit_id === unit_id)
}

export async function getBatchOnlyTrace(batch_id: number): Promise<PoultryBatchTrace[]> {
    const traces = await getTraceOfBatch(batch_id)
    return traces.filter((trace) => trace.unit_id === 0)
}

export async function getUnitOnlyTrace(unit_id: number): Promise<PoultryBatchTrace[]> {
    const unit = await getProcessedBatchById(unit_id)
    if (!unit) return []

    const traces = await getTraceOfBatch(unit.original_batch_id)
    return traces.filter((trace) => trace.unit_id === unit_id)
}

export async function addIoTTraceForBatch(
    batch_id: number,
    longitude: number,
    latitude: number,
    temperature: number,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'addIoTTraceForBatch',
        batch_id.toString(),
        longitude.toString(),
        latitude.toString(),
        temperature.toString(),
        JSON.stringify(extra_info)
    )
}

export async function addIoTTraceForProcessedBatch(
    unit_id: number,
    longitude: number,
    latitude: number,
    temperature: number,
    extra_info: Record<string, string>
) {
    await contract.submitTransaction(
        'addIoTTraceForProcessedBatch',
        unit_id.toString(),
        longitude.toString(),
        latitude.toString(),
        temperature.toString(),
        JSON.stringify(extra_info)
    )
}
