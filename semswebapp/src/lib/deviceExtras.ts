// Datos extra del dispositivo (ubicación y perfil de consumo) guardados
// localmente por dispositivo. Los microservicios aún no exponen estos campos.

export interface ConsumptionProfile {
  id: string;
  name: string;
  watts: number; // potencia nominal de referencia
}

// Perfiles de consumo predefinidos (RF-ANL-01): potencia nominal por modelo.
export const CONSUMPTION_PROFILES: ConsumptionProfile[] = [
  { id: "none", name: "Sin perfil", watts: 0 },
  { id: "fridge_a", name: "Refrigeradora clase A", watts: 150 },
  { id: "fridge_std", name: "Refrigeradora estándar", watts: 350 },
  { id: "ac", name: "Aire acondicionado", watts: 1200 },
  { id: "water_heater", name: "Terma eléctrica", watts: 1500 },
  { id: "washer", name: "Lavadora", watts: 500 },
  { id: "microwave", name: "Microondas", watts: 1000 },
  { id: "tv", name: "Televisor LED", watts: 100 },
  { id: "computer", name: "Laptop / PC", watts: 120 },
  { id: "lighting", name: "Iluminación", watts: 60 },
];

export function profileById(id?: string): ConsumptionProfile {
  return CONSUMPTION_PROFILES.find((p) => p.id === id) ?? CONSUMPTION_PROFILES[0];
}

export interface DeviceExtras {
  location: string;
  profileId: string;
}

const key = (deviceId: string) => `sems-devx-${deviceId}`;

export function getDeviceExtras(deviceId: string): DeviceExtras {
  try {
    const raw = localStorage.getItem(key(deviceId));
    if (raw) return JSON.parse(raw) as DeviceExtras;
  } catch {
    /* noop */
  }
  return { location: "", profileId: "none" };
}

export function saveDeviceExtras(deviceId: string, extras: DeviceExtras) {
  if (!deviceId) return;
  localStorage.setItem(key(deviceId), JSON.stringify(extras));
}