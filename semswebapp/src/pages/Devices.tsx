import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Cpu, X, Loader2 } from "lucide-react";
import { Card, Button, Badge, Loading, ErrorState } from "../components/ui";
import { Field, inputCls } from "./Login";
import { listDevices, createDevice } from "../services/devices.service";
import type { Device, DeviceStatus } from "../types";

const statusMap: Record<DeviceStatus, { color: "green" | "slate" | "amber"; label: string }> = {
  ACTIVE: { color: "green", label: "Activo" },
  INACTIVE: { color: "slate", label: "Inactivo" },
  MAINTENANCE: { color: "amber", label: "Mantenimiento" },
};

export default function Devices() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const devices = useQuery({ queryKey: ["devices"], queryFn: listDevices });

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
      ) : devices.isError || !devices.data ? (
        <ErrorState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.data.map((d) => (
            <DeviceCard key={d.deviceId} device={d} />
          ))}
        </div>
      )}

      {open && (
        <AddDeviceModal
          onClose={() => setOpen(false)}
          onCreate={(payload) => create.mutate(payload)}
          loading={create.isPending}
        />
      )}
    </div>
  );
}

function DeviceCard({ device }: { device: Device }) {
  const st = statusMap[device.status];
  return (
    <Card>
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <Cpu className="h-5 w-5" />
        </span>
        <Badge color={st.color}>{st.label}</Badge>
      </div>
      <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{device.name}</h3>
      <p className="text-xs text-slate-400">{device.type}{device.location ? ` · ${device.location}` : ""}</p>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm dark:border-navy-800">
        <span className="text-slate-500 dark:text-slate-400">Potencia</span>
        <span className="font-semibold text-slate-900 dark:text-white">{device.ratedPowerW} W</span>
      </div>
      {device.lastSeen && <p className="mt-2 text-[11px] text-slate-400">Visto {device.lastSeen}</p>}
    </Card>
  );
}

function AddDeviceModal({
  onClose,
  onCreate,
  loading,
}: {
  onClose: () => void;
  onCreate: (p: Partial<Device>) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Cocina");
  const [ratedPowerW, setPower] = useState(100);
  const [location, setLocation] = useState("");

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
            onCreate({ name, type, ratedPowerW, location });
          }}
          className="space-y-4"
        >
          <Field label="Nombre">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Aire acondicionado" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                <option>Cocina</option>
                <option>Climatización</option>
                <option>Baño</option>
                <option>Entretenimiento</option>
                <option>Lavandería</option>
                <option>General</option>
              </select>
            </Field>
            <Field label="Potencia (W)">
              <input type="number" min={1} value={ratedPowerW} onChange={(e) => setPower(+e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Ubicación">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Sala" className={inputCls} />
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
