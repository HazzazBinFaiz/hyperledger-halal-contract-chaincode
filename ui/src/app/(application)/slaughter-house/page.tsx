import { listSlaughterHouses } from "@/lib/actions/slaughter-house"
import SlaugterHouse from "./SlaughterHouseClient"

export default async function Page() {
  const slaughterHouses = await listSlaughterHouses()

  return <SlaugterHouse initialSlaughterHouses={slaughterHouses} />
}
