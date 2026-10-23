import { NextResponse } from 'next/server';
import { getBcvRate, setManualBcvRate, clearManualBcvRate, BCV_FALLBACK_RATE } from '@/lib/bcv';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const rateInfo = await getBcvRate(forceRefresh);
    return NextResponse.json(rateInfo);
  } catch (err) {
    return NextResponse.json(
      {
        rate: BCV_FALLBACK_RATE,
        formattedRate: BCV_FALLBACK_RATE.toLocaleString('es-VE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        }),
        currency: 'Bs/USD',
        date: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString(),
        source: 'fallback',
        isStale: true,
        notes: err instanceof Error ? err.message : 'Error al consultar BCV',
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.clearManual) {
      clearManualBcvRate();
      const freshRate = await getBcvRate(true);
      return NextResponse.json({
        success: true,
        message: 'Tasa manual eliminada. Sincronizando con fuentes oficiales.',
        rateInfo: freshRate,
      });
    }

    const manualRate = parseFloat(body.manualRate);
    if (isNaN(manualRate) || manualRate <= 0) {
      return NextResponse.json(
        { success: false, error: 'La tasa debe ser un número positivo mayor que 0' },
        { status: 400 }
      );
    }

    const updatedInfo = setManualBcvRate(manualRate);
    return NextResponse.json({
      success: true,
      message: 'Tasa manual provisional establecida con éxito',
      rateInfo: updatedInfo,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error procesando solicitud' },
      { status: 500 }
    );
  }
}
