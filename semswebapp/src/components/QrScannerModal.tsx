import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera } from "lucide-react";
import { useLang } from "../context/LanguageContext";

// Modal que abre la cámara y devuelve el texto del QR escaneado.
// Se usa para leer el código de serie del medidor EOS (RF-DEV-01).
export default function QrScannerModal({
  onResult,
  onClose,
}: {
  onResult: (text: string) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const containerId = "qr-reader-region";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId, { verbose: false });
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (stopped) return;
          stopped = true;
          // Detenemos antes de devolver para liberar la cámara.
          scanner.stop().catch(() => {}).finally(() => onResult(decodedText));
        },
        () => {
          /* fallos de decodificación por frame: se ignoran */
        }
      )
      .catch(() => {
        setError(t("No se pudo acceder a la cámara. Revisa los permisos.", "Couldn't access the camera. Check permissions."));
      });

    return () => {
      stopped = true;
      const s = scannerRef.current;
      if (s && s.isScanning) s.stop().catch(() => {});
    };
  }, [onResult, t]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-navy-800 dark:bg-navy-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900 dark:text-white">
            <Camera className="h-5 w-5 text-blue-600" />
            {t("Escanear QR del medidor", "Scan meter QR")}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label={t("Cerrar", "Close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div id={containerId} className="overflow-hidden rounded-xl bg-slate-950" />

        {error ? (
          <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>
        ) : (
          <p className="mt-3 text-center text-xs text-slate-400">
            {t("Apunta la cámara al código QR del medidor EOS.", "Point the camera at the EOS meter's QR code.")}
          </p>
        )}
      </div>
    </div>
  );
}