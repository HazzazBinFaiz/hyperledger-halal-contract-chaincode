import { listRetailShop } from "./action"
import RetailShopClient from "./RetailShopClient"

export default async function Page() {
  const retailShops = await listRetailShop()

  return <RetailShopClient initialRetailShops={retailShops} />
}