import { api, DEMO_MODE, delay } from "../lib/api";
import { demoDevices } from "../lib/demo";
import type { Device, CreateDevicePayload } from "../types";

// Device Management Service (vía API Gateway).
const BASE = "/api/v1/device-management";

// Lista los dispositivos del usuario logueado (si pasamos su id) o todos.
export async function listDevices(userId?: string): Promise<Device[]> {
  if (DEMO_MODE) {
    await delay();
    return demoDevices;
  }
  const url = userId ? `${BASE}/users/${userId}/devices` : `${BASE}/devices`;
  const { data } = await api.get<Device[]>(url);
  return data ?? [];
}

export async function getDevice(deviceId: string): Promise<Device> {
  if (DEMO_MODE) {
    await delay(250);
    return demoDevices.find((d) => d.deviceId === deviceId) ?? demoDevices[0];
  }
  const { data } = await api.get<Device>(`${BASE}/devices/${deviceId}`);
  return data;
}

export async function createDevice(payload: CreateDevicePayload): Promise<Device> {
  if (DEMO_MODE) {
    await delay();
    const now = new Date().toISOString();
    return {
      deviceId: crypto.randomUUID(),
      status: "ACTIVE",
      registeredAt: now,
      updatedAt: now,
      ...payload,
    };
  }
  const { data } = await api.post<Device>(`${BASE}/devices`, payload);
  return data;
}

export async function updateDevice(
  deviceId: string,
  payload: Partial<CreateDevicePayload>
): Promise<Device> {
  if (DEMO_MODE) {
    await delay();
    const base = demoDevices.find((d) => d.deviceId === deviceId) ?? demoDevices[0];
    return { ...base, ...payload, updatedAt: new Date().toISOString() };
  }
  const { data } = await api.put<Device>(`${BASE}/devices/${deviceId}`, payload);
  return data;
}

export async function deleteDevice(deviceId: string): Promise<void> {
  if (DEMO_MODE) {
    await delay(200);
    return;
  }
  await api.delete(`${BASE}/devices/${deviceId}`);
}