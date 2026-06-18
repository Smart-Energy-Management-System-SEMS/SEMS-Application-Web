import { api, DEMO_MODE, delay } from "../lib/api";
import { demoReadings, demoConsumption, demoMeters } from "../lib/demo";
import type { EnergyReading, DeviceConsumption, EnergyMeter } from "../types";

export async function getReadings(days = 14): Promise<EnergyReading[]> {
  if (DEMO_MODE) {
    await delay();
    return demoReadings(days);
  }
  const { data } = await api.get<EnergyReading[]>("/api/v1/energy/energy-readings/range", {
    params: { days },
  });
  return data;
}

export async function getDeviceConsumption(): Promise<DeviceConsumption[]> {
  if (DEMO_MODE) {
    await delay();
    return demoConsumption;
  }
  const { data } = await api.get<DeviceConsumption[]>("/api/v1/energy/device-consumptions/user/me/top");
  return data;
}

export async function getMeters(): Promise<EnergyMeter[]> {
  if (DEMO_MODE) {
    await delay(250);
    return demoMeters;
  }
  const { data } = await api.get<EnergyMeter[]>("/api/v1/energy/energy-meters/user/me");
  return data;
}
