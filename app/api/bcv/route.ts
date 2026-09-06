import { NextResponse } from 'next/server'
import { getBcvRate } from '@/lib/bcv'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rateInfo = await getBcvRate()
    return NextResponse.json(rateInfo)
  } catch (err) {
    return NextResponse.json(
      {
        rate: 813.74,
        formattedRate: '813,74',
        currency: 'Bs/USD',
        date: new Date().toISOString().split('T')[0],
        source: 'fallback',
        error: err instanceof Error ? err.message : 'Error al consultar BCV',
      },
      { status: 200 }
    )
  }
}
