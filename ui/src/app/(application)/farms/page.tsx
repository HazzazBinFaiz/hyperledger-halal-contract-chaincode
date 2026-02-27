import { listFarms } from "./action"
import FarmsClient from "./FarmsClient"

export default async function Page() {
  const farms = await listFarms()

  return <FarmsClient initialFarms={farms} />
}