import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/server/auth';
import { exportCsv } from '@/lib/server/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const csv = await exportCsv(`${proto}://${host}`);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="convidados-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
