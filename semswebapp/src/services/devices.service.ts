import { api, DEMO_MODE, delay } from "../lib/api";
import { demoDevices } from "../lib/demo";
import type { Device } from "../types";

export async function listDevices(): Promise<Device[]> {
  if (DEMO_MODE) {
    await delay();
    return demoDevices;
  }
  const { data } = await api.get<Device[]>("/api/v1/devices");
  return data;
}

export async function getDevice(deviceId: string): Promise<Device> {
  if (DEMO_MODE) {
    await delay(250);
    return demoDevices.find((d) => d.deviceId === deviceId) ?? demoDevices[0];
  }
  const { data } = await api.get<Device>(`/api/v1/devices/${deviceId}`);
  return data;
}

export async function createDevice(payload: Partial<Device>): Promise<Device> {
  if (DEMO_MODE) {
    await delay();
    return {
      deviceId: `d-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: payload.name ?? "Nuevo dispositivo",
      type: payload.type ?? "General",
      status: "ACTIVE",
      ratedPowerW: payload.ratedPowerW ?? 100,
      location: payload.location,
      lastSeen: "recién",
    };
  }
  const { data } = await api.post<Device>("/api/v1/devices", payload);
  return data;
}
