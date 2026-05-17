export interface CampusConfig {
  id: string
  name: string
  baseUrl: string
  schoolId: string
}

export const CAMPUSES: Record<string, CampusConfig> = {
  upiita: {
    id: 'upiita',
    name: 'UPIITA',
    baseUrl: 'https://www.saes.upiita.ipn.mx',
    schoolId: '64'
  },
  upiicsa: {
    id: 'upiicsa',
    name: 'UPIICSA',
    baseUrl: 'https://www.saes.upiicsa.ipn.mx',
    schoolId: '60'
  }
}

export function getCampus(id: string): CampusConfig {
  const campus = CAMPUSES[id]
  if (!campus) throw new Error(`Campus "${id}" no encontrado. Disponibles: ${Object.keys(CAMPUSES).join(', ')}`)
  return campus
}

export function listCampuses(): CampusConfig[] {
  return Object.values(CAMPUSES)
}
