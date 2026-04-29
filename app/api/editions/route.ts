import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const data = readFileSync(join(process.cwd(), 'data/editions.json'), 'utf-8');
    const currentYear = new Date().getFullYear().toString();
    const editions = JSON.parse(data)
      .filter((e: any) => e.img && e.pdf)
      .filter((e: any) => e.title.includes(currentYear) || e.date.startsWith(currentYear));
    return NextResponse.json(editions);
  } catch {
    return NextResponse.json([]);
  }
}
