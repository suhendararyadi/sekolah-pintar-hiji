// ==============================================================================
// FILE: app/api/[[...route]]/route.ts (API Proxy)
// ==============================================================================
// TUJUAN: Selama development, file ini akan meneruskan semua request dari
//         /api/* di Next.js ke Cloudflare Worker kita yang berjalan lokal.
//         Ini cara mudah untuk menghindari masalah CORS saat development.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workerUrl = `${process.env.CLOUDFLARE_WORKER_URL}${url.pathname}${url.search}`;

  return fetch(workerUrl, {
    headers: request.headers,
    redirect: 'manual',
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const workerUrl = `${process.env.CLOUDFLARE_WORKER_URL}${url.pathname}${url.search}`;

  return fetch(workerUrl, {
    method: 'POST',
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
  });
}

// Anda bisa menambahkan metode lain (PUT, DELETE, etc.) jika dibutuhkan
