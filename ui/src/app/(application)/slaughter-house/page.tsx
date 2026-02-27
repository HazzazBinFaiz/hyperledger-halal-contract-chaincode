import { listSlaughterHouses } from "./action"
import SlaugterHouse from "./SlaughterHouseClient"

export default async function Page() {
  const slaughterHouses = await listSlaughterHouses()

  return <SlaugterHouse initialSlaughterHouses={slaughterHouses} />
}