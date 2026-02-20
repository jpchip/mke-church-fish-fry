export interface Location {
  id: number
  name: string
  address: string | null
  city: string | null
  state: string
  phone: string | null
  website: string | null
  venue_notes: string | null
}

export interface FishFry {
  id: number
  location_id: number
  is_recurring: number        // 0 | 1
  start_date: string | null
  end_date: string | null
  specific_dates: string | null  // JSON array of ISO date strings
  hours_open: string | null
  hours_close: string | null
  fish_types: string | null
  sides: string | null
  price_adult: number | null
  price_child: number | null
  price_senior: number | null
  price_family: number | null
  price_notes: string | null
  drinks_included: string | null
  drinks_purchase: string | null
  dessert_included: number       // 0 | 1
  dine_in: number                // 0 | 1
  carry_out: number              // 0 | 1
  drive_through: number          // 0 | 1
  description: string | null
}

export interface LocationWithFishFry extends Location {
  fishFry: FishFry
}
