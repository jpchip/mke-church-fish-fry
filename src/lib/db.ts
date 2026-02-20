import initSqlJs, { type Database, type QueryExecResult } from 'sql.js'
import type { Location, FishFry, LocationWithFishFry } from './types'

let _db: Database | null = null

async function getDb(): Promise<Database> {
  if (_db) return _db

  const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' })
  const response = await fetch('/fish_fry.db')
  const buffer = await response.arrayBuffer()
  _db = new SQL.Database(new Uint8Array(buffer))
  return _db
}

function rowsToObjects<T>(result: QueryExecResult): T[] {
  if (!result) return []
  const { columns, values } = result
  return values.map((row) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => { obj[col] = row[i] })
    return obj as T
  })
}

export async function getAllLocations(): Promise<Location[]> {
  const db = await getDb()
  const res = db.exec('SELECT * FROM locations ORDER BY name')
  return res[0] ? rowsToObjects<Location>(res[0]) : []
}

export async function getLocationsWithFishFries(): Promise<LocationWithFishFry[]> {
  const db = await getDb()
  const res = db.exec(`
    SELECT
      l.id, l.name, l.address, l.city, l.state, l.phone, l.website, l.venue_notes,
      f.id          AS ff_id,
      f.location_id, f.is_recurring, f.start_date, f.end_date, f.specific_dates,
      f.hours_open, f.hours_close, f.fish_types, f.sides,
      f.price_adult, f.price_child, f.price_senior, f.price_family, f.price_notes,
      f.drinks_included, f.drinks_purchase, f.dessert_included,
      f.dine_in, f.carry_out, f.drive_through, f.description
    FROM locations l
    JOIN fish_fries f ON f.location_id = l.id
    ORDER BY l.name
  `)
  if (!res[0]) return []

  return rowsToObjects<Record<string, unknown>>(res[0]).map((row) => {
    const location: Location = {
      id: row.id as number,
      name: row.name as string,
      address: row.address as string | null,
      city: row.city as string | null,
      state: row.state as string,
      phone: row.phone as string | null,
      website: row.website as string | null,
      venue_notes: row.venue_notes as string | null,
    }
    const fishFry: FishFry = {
      id: row.ff_id as number,
      location_id: row.location_id as number,
      is_recurring: row.is_recurring as number,
      start_date: row.start_date as string | null,
      end_date: row.end_date as string | null,
      specific_dates: row.specific_dates as string | null,
      hours_open: row.hours_open as string | null,
      hours_close: row.hours_close as string | null,
      fish_types: row.fish_types as string | null,
      sides: row.sides as string | null,
      price_adult: row.price_adult as number | null,
      price_child: row.price_child as number | null,
      price_senior: row.price_senior as number | null,
      price_family: row.price_family as number | null,
      price_notes: row.price_notes as string | null,
      drinks_included: row.drinks_included as string | null,
      drinks_purchase: row.drinks_purchase as string | null,
      dessert_included: row.dessert_included as number,
      dine_in: row.dine_in as number,
      carry_out: row.carry_out as number,
      drive_through: row.drive_through as number,
      description: row.description as string | null,
    }
    return { ...location, fishFry }
  })
}

export async function getLocationById(id: number): Promise<LocationWithFishFry | null> {
  const all = await getLocationsWithFishFries()
  return all.find((l) => l.id === id) ?? null
}
