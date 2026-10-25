'use client';

import { useState } from 'react';
import { RefreshCw, AlertTriangle, SlidersHorizontal, DollarSign, Info } from 'lucide-react';
import { useBcvRate } from '@/lib/hooks/use-bcv-rate';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function BcvBadge() {
  const { rate, formattedRate, loading, isStale, source, date, refresh, setManualRate, clearManualRate } =
    useBcvRate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [savingManual, setSavingManual] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const isManual = source === 'manual_override';

  const handleOpenDialog = () => {
    setManualInput(rate.toString());
    setDialogError(null);
    setDialogOpen(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError(null);
    const num = parseFloat(manualInput.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      setDialogError('Ingresa un número válido mayor a 0 (ej: 885.50)');
      return;
    }
    setSavingManual(true);
    try {
      await setManualRate(num);
      setDialogOpen(false);
    } catch {
      setDialogError('Error al guardar la tasa manual.');
    } finally {
      setSavingManual(false);
    }
  };

  const handleResetAutomatic = async () => {
    setSavingManual(true);
    setDialogError(null);
    try {
      await clearManualRate();
      setDialogOpen(false);
    } catch {
      setDialogError('Error al restablecer la tasa.');
    } finally {
      setSavingManual(false);
    }
  };

  // Títulos accesibles según estado
  let badgeClasses =
    'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl border text-xs font-bold transition-colors active:scale-95 group shadow-2xs shrink-0 cursor-pointer';
  let badgeTitle = `Tasa Oficial BCV: Bs. ${formattedRate} (Fecha: ${date}). Clic para ver opciones.`;

  if (isManual) {
    badgeClasses += ' bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200';
    badgeTitle = `Tasa Manual Provisional Activa: Bs. ${formattedRate}. Clic para editar o volver a automático.`;
  } else if (isStale) {
    badgeClasses += ' bg-rose-500/15 border-rose-500/40 text-rose-800 dark:text-rose-200';
    badgeTitle = `Alerta: Tasa BCV no sincronizada. Mostrando última registrada (Bs. ${formattedRate} del ${date}). Clic para fijar tasa manual.`;
  } else {
    badgeClasses += ' bg-primary/10 border-primary/25 text-foreground hover:bg-primary/20';
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenDialog}
        title={badgeTitle}
        aria-label={badgeTitle}
        className={badgeClasses}
      >
        {isManual ? (
          <SlidersHorizontal className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
        ) : isStale ? (
          <AlertTriangle className="size-3.5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" aria-hidden="true" />
        ) : (
          <span className="text-primary font-black flex items-center">
            <span className="text-[11px] text-muted-foreground uppercase font-semibold hidden sm:inline mr-1">BCV:</span>
          </span>
        )}

        <span className="font-semibold text-[11px] sm:text-xs">
          <span className="hidden sm:inline">Bs. </span>
          {formattedRate}
        </span>

        {isManual && (
          <span className="text-[9px] px-1 py-0 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold hidden sm:inline">
            Manual
          </span>
        )}

        {isStale && !isManual && (
          <span className="text-[9px] px-1 py-0 rounded bg-rose-500/20 text-rose-800 dark:text-rose-300 font-bold hidden sm:inline">
            Desactualizada
          </span>
        )}

        <RefreshCw
          className={`size-2.5 sm:size-3 text-muted-foreground group-hover:text-primary transition-colors ${
            loading ? 'animate-spin text-primary' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Modal de Control Cambiario y Tasa Manual */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <DollarSign className="size-5 text-primary" aria-hidden="true" />
              <span>Control Cambiario & Tasa BCV</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configuración de la tasa oficial del Banco Central de Venezuela para cálculos y cobros en bolívares.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Estado actual de la sincronización */}
            <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Tasa en uso en el sistema:</span>
                <span className="text-base font-extrabold text-foreground">
                  Bs. {formattedRate}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                <span>Fuente de datos:</span>
                <span className="font-semibold text-foreground">
                  {source === 'bcv_direct'
                    ? 'Página Oficial bcv.org.ve'
                    : source === 'dolarapi_backup'
                    ? 'Respaldo ve.dolarapi.com'
                    : source === 'pydolarve_backup'
                    ? 'Respaldo pydolarve.org'
                    : source === 'manual_override'
                    ? 'Tasa manual provisional del operador'
                    : 'Última tasa registrada (modo sin conexión)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Fecha valor reportada:</span>
                <span className="font-medium text-foreground">{date}</span>
              </div>
            </div>

            {/* Alerta si está desactualizada */}
            {isStale && !isManual && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>Falla de sincronización externa</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  No se pudo conectar con la página del BCV ni con las APIs de respaldo. El sistema está operando con la última tasa guardada del {date}. Puedes fijar una tasa manual temporal a continuación.
                </p>
              </div>
            )}

            {/* Alerta si hay tasa manual activa */}
            {isManual && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Tasa manual provisional activa</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Esta tasa manual está gobernando todos los cálculos del POS y caja. Si deseas sincronizar nuevamente con el BCV, haz clic en &quot;Restablecer a Tasa Oficial&quot;.
                </p>
              </div>
            )}

            {/* Formulario de Tasa Manual */}
            <form onSubmit={handleSaveManual} className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="manual-rate-input" className="text-xs font-semibold text-foreground block">
                  Establecer Tasa Manual Provisional (Bs/USD):
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="manual-rate-input"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Ej: 885.50"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="h-10 text-sm font-semibold"
                  />
                  <Button
                    type="submit"
                    disabled={savingManual}
                    className="h-10 px-4 text-xs font-bold shrink-0"
                  >
                    {savingManual ? 'Guardando...' : 'Aplicar'}
                  </Button>
                </div>
                {dialogError && <p className="text-xs text-destructive font-medium">{dialogError}</p>}
              </div>
            </form>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t">
            {isManual && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetAutomatic}
                disabled={savingManual}
                className="text-xs font-semibold"
              >
                Restablecer a Oficial Automática
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                setSavingManual(true);
                await refresh();
                setSavingManual(false);
              }}
              disabled={loading || savingManual}
              className="gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Consultando...' : 'Reintentar BCV Oficial'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
