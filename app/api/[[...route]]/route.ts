// ==============================================================================
// FILE: app/api/[[...route]]/route.ts (API Proxy) - DIPERBAIKI
// ==============================================================================
// TUJUAN: Meneruskan semua request dari /api/* di Next.js ke Cloudflare Worker
//         dan memastikan route ini kompatibel dengan Edge Runtime Cloudflare.

export const runtime = 'edge';

// Fungsi untuk menangani request GET
export async function GET(request: Request) {
  const incomingUrl = new URL(request.url);
  
  const workerBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.CLOUDFLARE_WORKER_URL;

  if (!workerBaseUrl) {
    return new Response('Worker URL not configured', { status: 500 });
  }

  // PERBAIKAN: Menggunakan constructor URL untuk menggabungkan URL secara aman.
  // Ini mencegah masalah seperti double slash (//) atau path yang salah.
  const finalWorkerUrl = new URL(incomingUrl.pathname, workerBaseUrl);
  finalWorkerUrl.search = incomingUrl.search;

  return fetch(finalWorkerUrl.href, {
    headers: request.headers,
    redirect: 'manual',
  });
}

// Fungsi untuk menangani request POST
export async function POST(request: Request) {
  const incomingUrl = new URL(request.url);

  const workerBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.CLOUDFLARE_WORKER_URL;

  if (!workerBaseUrl) {
    return new Response('Worker URL not configured', { status: 500 });
  }

  // PERBAIKAN: Menerapkan logika yang sama untuk request POST.
  const finalWorkerUrl = new URL(incomingUrl.pathname, workerBaseUrl);
  finalWorkerUrl.search = incomingUrl.search;

  return fetch(finalWorkerUrl.href, {
    method: 'POST',
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
  });
}
