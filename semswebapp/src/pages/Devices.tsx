import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Cpu, X, Loader2, Wifi, Bluetooth } from "lucide-react";
import { Card, Button, Badge, Loading, ErrorState } from "../components/ui";
import { Field, inputCls } from "./Login";
import { listDevices, createDevice } from "../services/devices.service";
import { useAuth } from "../context/AuthContext";
import type { Device, DeviceStatus, CreateDevicePayload } from "../types";

const statusMap: Record<DeviceStatus, { color: "green" | "slate" | "amber"; label: string }> = {
  ACTIVE: { color: "green", label: "Activo" },
  INACTIVE: { color: "slate", label: "Inactivo" },
  MAINTENANCE: { color: "amber", label: "Mantenimiento" },
};

export default function Devices() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const devices = useQuery({
    queryKey: ["devices", user?.id],
    queryFn: () => listDevices(user?.id),
  });

  const create = useMutation({
    mutationFn: createDevice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["devices"] });
      setOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">Dispositivos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gestiona los equipos vinculados a tu medidor.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      </div>

      {devices.isLoading ? (
        <Loading />
      ) : devices.isError ? (
        <ErrorState />
      ) : !devices.data || devices.data.length === 0 ? (
        <Card className="text-center text-sm text-slate-400">
          Aún no tienes dispositivos registrados. Agrega el primero con el botón "Agregar".
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.data.map((d) => (
            <DeviceCard key={d.deviceId} device={d} />
          ))}
        </div>
      )}

      {open && (
        <AddDeviceModal
          userId={user?.id ?? ""}
          onClose={() => setOpen(false)}
          onCreate={(payload) => create.mutate(payload)}
          loading={create.isPending}
        />
      )}
    </div>
  );
}

function DeviceCard({ device }: { device: Device }) {
  const st = statusMap[device.status] ?? statusMap.INACTIVE;
  return (
    <Card>
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <Cpu className="h-5 w-5" />
        </span>
        <Badge color={st.color}>{st.label}</Badge>
      </div>
      <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{device.deviceName}</h3>
      <p className="text-xs text-slate-400">{device.deviceType}</p>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm dark:border-navy-800">
        <Row label="Marca / Modelo" value={`${device.brand} ${device.model}`} />
        <Row
          label="Conexión"
          value={
            <span className="inline-flex items-center gap-1">
              {device.connectionProtocol === "BLUETOOTH" ? <Bluetooth className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              {device.connectionProtocol}
            </span>
          }
        />
        <Row label="Código" value={device.externalDeviceCode} />
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="truncate font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

const DEVICE_TYPES = [
  "meter", "AIR_CONDITIONER", "REFRIGERATOR", "WATER_HEATER", "TV",
  "WASHING_MACHINE", "MICROWAVE", "THERMOSTAT", "SENSOR", "smart_plug", "Mobile",
];
const PROTOCOLS = ["WIFI", "BLUETOOTH"];

function AddDeviceModal({
  userId,
  onClose,
  onCreate,
  loading,
}: {
  userId: string;
  onClose: () => void;
  onCreate: (p: CreateDevicePayload) => void;
  loading: boolean;
}) {
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("meter");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [connectionProtocol, setConnectionProtocol] = useState("WIFI");
  const [externalDeviceCode, setExternalDeviceCode] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-card border border-slate-200 bg-white p-6 shadow-xl dark:border-navy-800 dark:bg-navy-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Agregar dispositivo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({ deviceName, deviceType, brand, model, connectionProtocol, externalDeviceCode, userId });
          }}
          className="space-y-4"
        >
          <Field label="Nombre del dispositivo">
            <input required value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="Ej: Medidor cocina" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className={inputCls}>
                {DEVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Conexión">
              <select value={connectionProtocol} onChange={(e) => setConnectionProtocol(e.target.value)} className={inputCls}>
                {PROTOCOLS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marca">
              <input required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej: Itron" className={inputCls} />
            </Field>
            <Field label="Modelo">
              <input required value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ej: EM100" className={inputCls} />
            </Field>
          </div>
          <Field label="Código externo">
            <input required value={externalDeviceCode} onChange={(e) => setExternalDeviceCode(e.target.value)} placeholder="Ej: MED-001" className={inputCls} />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}