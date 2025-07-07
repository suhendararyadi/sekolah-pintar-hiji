// ==============================================================================
// FILE: app/api/[[...route]]/route.ts (API Proxy) - DIPERBAIKI
// ==============================================================================
// TUJUAN: Meneruskan semua request dari /api/* di Next.js ke Cloudflare Worker
//         dan memastikan route ini kompatibel dengan Edge Runtime Cloudflare.

// PERBAIKAN: Tambahkan baris ini untuk memberitahu Next.js agar menjalankan
// route ini di Edge Runtime, yang wajib untuk Cloudflare Pages.
export const runtime = 'edge';

// Fungsi untuk menangani request GET
export async function GET(request: Request) {
  const url = new URL(request.url);
  
  // Ambil URL worker dari environment variable
  // Gunakan NEXT_PUBLIC_API_URL saat di-deploy, dan CLOUDFLARE_WORKER_URL untuk local dev
  const workerBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.CLOUDFLARE_WORKER_URL;

  if (!workerBaseUrl) {
    return new Response('Worker URL not configured', { status: 500 });
  }

  const workerUrl = `${workerBaseUrl}${url.pathname}${url.search}`;

  return fetch(workerUrl, {
    headers: request.headers,
    redirect: 'manual',
  });
}

// Fungsi untuk menangani request POST
export async function POST(request: Request) {
  const url = new URL(request.url);

  const workerBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.CLOUDFLARE_WORKER_URL;

  if (!workerBaseUrl) {
    return new Response('Worker URL not configured', { status: 500 });
  }

  const workerUrl = `${workerBaseUrl}${url.pathname}${url.search}`;

  return fetch(workerUrl, {
    method: 'POST',
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
  });
}
