"use server"

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

let batches: PoultryBatch[] = []

export async function getAllBatches(): Promise<PoultryBatch[]> {
  return batches
}

export async function createPoultryBatch(data: {
  id: number
  farm_id: number
  add_date: string
  age_of_chicken: number
  breed_type: string
  ideal_temperature: number
  extra_info: Record<string, string>
}) {
  const exists = batches.find(b => b.id === data.id)
  if (exists) throw new Error("Batch exists")

  const batch: PoultryBatch = {
    id: data.id,
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
  }

  batches.push(batch)
  return batch
}