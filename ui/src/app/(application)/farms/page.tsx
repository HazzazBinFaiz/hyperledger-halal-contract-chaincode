import { listFarms } from "@/lib/actions/farm"
import FarmsClient from "./FarmsClient"

export default async function Page() {
  const farms = await listFarms()

  return <FarmsClient initialFarms={farms} />
}
