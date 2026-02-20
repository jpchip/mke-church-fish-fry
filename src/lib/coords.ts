/** Geocoded coordinates (lat, lon) keyed by location.id.
 *  IDs 14 and 22 are approximate town-centre fallbacks. */
export const COORDS: Record<number, [number, number]> = {
  1:  [43.10487, -87.89639],  // Holy Family Parish
  2:  [43.01875, -88.05779],  // Mother of Perpetual Help Parish
  3:  [43.01870, -87.97015],  // Notre Dame School of Milwaukee
  4:  [42.77620, -87.80240],  // Northwest Parishes of Racine
  5:  [42.91921, -88.00076],  // Polish Center of Wisconsin
  6:  [43.03931, -87.95178],  // Pompeii Men's Club
  7:  [43.08413, -88.21275],  // Queen of Apostles Parish
  8:  [42.99848, -87.90464],  // St. Augustine of Hippo Parish
  9:  [43.00764, -87.99712],  // St. Barnabas
  10: [43.14413, -88.01328],  // St. Bernadette Parish
  11: [43.23507, -88.16217],  // St. Boniface Parish
  12: [43.08915, -88.13889],  // St. Dominic Parish
  13: [42.98718, -87.98965],  // St. Gregory the Great
  14: [42.87591, -88.35588],  // St. James the Less (approx — Mukwonago area)
  15: [42.96731, -88.02006],  // St. John the Evangelist
  16: [42.88273, -88.20311],  // St. Joseph Parish Big Bend
  17: [42.69650, -87.81258],  // St. Lucy Parish
  18: [42.97506, -88.37829],  // St. Paul Catholic Church
  19: [43.05354, -87.98106],  // St. Sebastian Parish
  20: [42.85719, -87.93554],  // St. Stephen Parish
  21: [42.87994, -88.47559],  // St. Theresa of Avila Church
  22: [42.80583, -88.20726],  // St. Thomas Aquinas Parish (approx — Waterford area)
}

/** Haversine distance in miles between two lat/lon points. */
export function distanceMi(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
