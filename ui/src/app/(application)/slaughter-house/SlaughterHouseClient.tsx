"use client"

import { useState, useTransition } from "react"
import { createSlaughterHouses, listSlaughterHouses, SlaughterHouse } from "@/lib/actions/slaughter-house"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import ExtraInfoEditor from "@/components/extra-info-editor"
import ExtraInfoView from "@/components/extra-info-view"

const schema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

type ExtraRow = {
  key: string
  value: string
  type?: "text" | "boolean" | "image" | "file"
  boolValue?: boolean
  removable?: boolean
  lockedType?: boolean
}

export default function SlaughterHouseClient({
  initialSlaughterHouses,
}: {
  initialSlaughterHouses: SlaughterHouse[]
}) {
  const [slaughterHouses, setSlaughterHouses] = useState<SlaughterHouse[]>(initialSlaughterHouses)
  const [isPending, startTransition] = useTransition()
  const [extraRows, setExtraRows] = useState<ExtraRow[]>([
    { key: "", value: "", type: "text", boolValue: false, removable: true, lockedType: true },
  ])

  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", address: "" },
  })

  const onSubmit = (data: FormValues) => {
    const additionalObject = extraRows
      .filter((row) => row.key.trim())
      .reduce((acc, row) => {
        if ((row.type ?? "text") === "boolean") {
          acc[row.key.trim()] = row.boolValue ? "YES" : "NO"
          return acc
        }
        acc[row.key.trim()] = row.value || ""
        return acc
      }, {} as Record<string, string>)

    startTransition(async () => {
      try {
        await createSlaughterHouses({
          name: data.name,
          address: data.address,
          extra_info: additionalObject,
        })

        const updated = await listSlaughterHouses()
        setSlaughterHouses(updated)

        reset()
        setExtraRows([{ key: "", value: "", type: "text", boolValue: false, removable: true, lockedType: true }])

        toast("Slaughter House Created", {
          description: "Slaughter House added successfully",
        })
      } catch {
        toast("Error", {
          description: "Failed to create slaughter house",
        })
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card className="mx-auto w-full">
        <CardHeader>
          <CardTitle>Create New Slaughter House</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap justify-center space-y-6">
            <div className="w-full md:w-1/2">
              <div className="p-2">
                <Label>Name *</Label>
                <Input className="mt-2" {...register("name")} />
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <div className="p-2">
                <Label>Address *</Label>
                <Input className="mt-2" {...register("address")} />
              </div>
            </div>

            <div className="w-full p-2">
              <ExtraInfoEditor rows={extraRows} onChange={setExtraRows} />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Creating..." : "Create Slaughter House"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slaughter Houses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slaughter House ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Additional Info</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaughterHouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    No slaughter house found
                  </TableCell>
                </TableRow>
              ) : (
                slaughterHouses.map((house) => (
                  <TableRow key={house.id}>
                    <TableCell>{house.id}</TableCell>
                    <TableCell>{house.name}</TableCell>
                    <TableCell>{house.address}</TableCell>
                    <TableCell>
                      <ExtraInfoView info={house.extra_info} compactThreshold={3} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
