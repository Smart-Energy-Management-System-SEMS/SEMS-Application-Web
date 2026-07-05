import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Cpu, X, Loader2, Wifi, Bluetooth, Trash2, Pencil } from "lucide-react";
import { Card, Button, Badge, Loading, ErrorState } from "../components/ui";
import { Field, inputCls } from "./Login";
import { listDevices, createDevice, updateDevice, deleteDevice } from "../services/devices.service";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { CONSUMPTION_PROFILES, profileById, getDeviceExtras, saveDeviceExtras, type DeviceExtras } from "../lib/deviceExtras";
import type { Device, DeviceStatus, CreateDevicePayload } from "../types";
import { usePlanTier } from "../hooks/usePlan";
import { DEVICE_LIMIT, TIER_LABEL } from "../lib/plan";
import { Link } from "react-router-dom";
const statusColor: Record<DeviceStatus, "green" | "slate" | "amber"> = {
  ACTIVE: "green",
  INACTIVE: "slate",
  MAINTENANCE: "amber",
};

export default function Devices() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);

  const devices = useQuery({
    queryKey: ["devices", user?.id],
    queryFn: () => listDevices(user?.id),
  });

  const create = useMutation({
    mutationFn: async (vars: { payload: CreateDevicePayload; extras: DeviceExtras }) => {
      const dev = await createDevice(vars.payload);
      saveDeviceExtras(dev.deviceId, vars.extras);
      return dev;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["devices"] });
      setOpen(false);
    },
  });

  const update = useMutation({
    mutationFn: async (vars: { id: string; payload: Partial<CreateDevicePayload>; extras: DeviceExtras }) => {
      saveDeviceExtras(vars.id, vars.extras);
      return updateDevice(vars.id, vars.payload);
    },
    onSuccess: () => {
      ["devices", "consumption", "summary", "rankings", "alerts", "thresholds"].forEach((key) =>
        qc.invalidateQueries({ queryKey: [key] })
      );
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: deleteDevice,
    onSuccess: (_data, deletedId) => {
      qc.setQueriesData<Device[]>({ queryKey: ["devices"] }, (old) =>
        old ? old.filter((d) => d.deviceId !== deletedId) : old
      );
    },
  });

  const tier = usePlanTier();
  const limit = DEVICE_LIMIT[tier];
  const count = devices.data?.length ?? 0;
  const atLimit = count >= limit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t("Dispositivos", "Devices")}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("Gestiona los equipos vinculados a tu medidor.", "Manage the devices linked to your meter.")}
            {Number.isFinite(limit) && ` · ${count}/${limit} (${TIER_LABEL[tier]})`}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={atLimit}>
          <Plus className="h-4 w-4" /> {t("Agregar", "Add")}
        </Button>
      </div>

      {atLimit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {t(`Alcanzaste el límite de ${limit} dispositivos de tu plan ${TIER_LABEL[tier]}.`, `You reached your ${TIER_LABEL[tier]} plan limit of ${limit} devices.`)}{" "}
          <Link to="/subscription" className="font-semibold underline">{t("Mejora tu plan", "Upgrade your plan")}</Link>
          {t(" para vincular más.", " to link more.")}
        </div>
      )}

      {devices.isLoading ? (
        <Loading />
      ) : devices.isError ? (
        <ErrorState />
      ) : !devices.data || devices.data.length === 0 ? (
        <Card className="text-center text-sm text-slate-400">
          {t('Aún no tienes dispositivos registrados. Agrega el primero con el botón "Agregar".', 'You have no devices yet. Add your first one with the "Add" button.')}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.data.map((d) => (
            <DeviceCard
              key={d.deviceId}
              device={d}
              onEdit={() => setEditing(d)}
              onDelete={() => remove.mutate(d.deviceId)}
              deleting={remove.isPending && remove.variables === d.deviceId}
            />
          ))}
        </div>
      )}

      {(open || editing) && (
        <DeviceModal
          userId={user?.id ?? ""}
          device={editing}
          onClose={() => { setOpen(false); setEditing(null); }}
          onCreate={(payload, extras) => create.mutate({ payload, extras })}
          onUpdate={(payload, extras) => editing && update.mutate({ id: editing.deviceId, payload, extras })}
          loading={create.isPending || update.isPending}
        />
      )}
    </div>
  );
}

function DeviceCard({ device, onEdit, onDelete, deleting }: { device: Device; onEdit: () => void; onDelete: () => void; deleting: boolean }) {
  const { t } = useLang();
  const statusLabel: Record<DeviceStatus, string> = {
    ACTIVE: t("Activo", "Active"),
    INACTIVE: t("Inactivo", "Inactive"),
    MAINTENANCE: t("Mantenimiento", "Maintenance"),
  };
  const [confirm, setConfirm] = useState(false);
  const extras = getDeviceExtras(device.deviceId);
  const profile = profileById(extras.profileId);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <Cpu className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-2">
          <Badge color={statusColor[device.status] ?? "slate"}>{statusLabel[device.status] ?? statusLabel.INACTIVE}</Badge>
          <button
            onClick={onEdit}
            title={t("Editar dispositivo", "Edit device")}
            className="text-slate-300 transition-colors hover:text-blue-500 dark:text-navy-700 dark:hover:text-blue-400"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirm(true)}
            disabled={deleting}
            title={t("Eliminar dispositivo", "Delete device")}
            className="text-slate-300 transition-colors hover:text-rose-500 disabled:opacity-50 dark:text-navy-700 dark:hover:text-rose-400"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{device.deviceName}</h3>
      <p className="text-xs text-slate-400">{device.deviceType}</p>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm dark:border-navy-800">
        <Row label={t("Marca / Modelo", "Brand / Model")} value={`${device.brand} ${device.model}`} />
        <Row
          label={t("Conexión", "Connection")}
          value={
            <span className="inline-flex items-center gap-1">
              {device.connectionProtocol === "BLUETOOTH" ? <Bluetooth className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              {device.connectionProtocol}
            </span>
          }
        />
        <Row label={t("Código", "Code")} value={device.externalDeviceCode} />
        {extras.location && <Row label={t("Ubicación", "Location")} value={extras.location} />}
        {profile.watts > 0 && <Row label={t("Perfil / potencia", "Profile / power")} value={`${profile.name} · ${profile.watts} W`} />}
      </div>

      {confirm && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-rose-700 dark:text-rose-300">{t("¿Eliminar", "Delete")} <strong>{device.deviceName}</strong>? {t("Esta acción no se puede deshacer.", "This action cannot be undone.")}</p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" className="!py-1.5 !text-xs" onClick={() => setConfirm(false)}>{t("Cancelar", "Cancel")}</Button>
            <Button
              className="!bg-rose-600 !py-1.5 !text-xs hover:!bg-rose-700"
              onClick={() => { setConfirm(false); onDelete(); }}
            >
              {t("Eliminar", "Delete")}
            </Button>
          </div>
        </div>
      )}
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

function DeviceModal({
  userId,
  device,
  onClose,
  onCreate,
  onUpdate,
  loading,
}: {
  userId: string;
  device: Device | null;
  onClose: () => void;
  onCreate: (p: CreateDevicePayload, extras: DeviceExtras) => void;
  onUpdate: (p: Partial<CreateDevicePayload>, extras: DeviceExtras) => void;
  loading: boolean;
}) {
  const isEdit = !!device;
  const initExtras = device ? getDeviceExtras(device.deviceId) : { location: "", profileId: "none" };
  const [deviceName, setDeviceName] = useState(device?.deviceName ?? "");
  const [deviceType, setDeviceType] = useState(device?.deviceType ?? "meter");
  const [brand, setBrand] = useState(device?.brand ?? "");
  const [model, setModel] = useState(device?.model ?? "");
  const [connectionProtocol, setConnectionProtocol] = useState(device?.connectionProtocol ?? "WIFI");
  const [externalDeviceCode, setExternalDeviceCode] = useState(device?.externalDeviceCode ?? "");
  const [location, setLocation] = useState(initExtras.location);
  const [profileId, setProfileId] = useState(initExtras.profileId);
  const { t } = useLang();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-card border border-slate-200 bg-white p-6 shadow-xl dark:border-navy-800 dark:bg-navy-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? t("Editar dispositivo", "Edit device") : t("Agregar dispositivo", "Add device")}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const extras = { location, profileId };
            if (isEdit) {
              onUpdate({ deviceName, deviceType, brand, model, connectionProtocol, externalDeviceCode }, extras);
            } else {
              onCreate({ deviceName, deviceType, brand, model, connectionProtocol, externalDeviceCode, userId }, extras);
            }
          }}
          className="space-y-4"
        >
          <Field label={t("Nombre del dispositivo", "Device name")}>
            <input required value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder={t("Ej: Medidor cocina", "e.g. Kitchen meter")} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Tipo", "Type")}>
              <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className={inputCls}>
                {DEVICE_TYPES.map((opt) => <option key={opt}>{opt}</option>)}
              </select>
            </Field>
            <Field label={t("Conexión", "Connection")}>
              <select value={connectionProtocol} onChange={(e) => setConnectionProtocol(e.target.value)} className={inputCls}>
                {PROTOCOLS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Marca", "Brand")}>
              <input required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej: Itron" className={inputCls} />
            </Field>
            <Field label={t("Modelo", "Model")}>
              <input required value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ej: EM100" className={inputCls} />
            </Field>
          </div>
          <Field label={t("Código externo", "External code")}>
            <input required value={externalDeviceCode} onChange={(e) => setExternalDeviceCode(e.target.value)} placeholder="Ej: MED-001" className={inputCls} />
          </Field>
          <Field label={t("Ubicación", "Location")}>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("Ej: Cocina, 1er piso", "e.g. Kitchen, 1st floor")} className={inputCls} />
          </Field>
          <Field label={t("Perfil de consumo (potencia nominal)", "Consumption profile (nominal power)")}>
            <select value={profileId} onChange={(e) => setProfileId(e.target.value)} className={inputCls}>
              {CONSUMPTION_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>{p.watts > 0 ? `${p.name} (${p.watts} W)` : p.name}</option>
              ))}
            </select>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>{t("Cancelar", "Cancel")}</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} {isEdit ? t("Guardar cambios", "Save changes") : t("Guardar", "Save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}