// ==============================================================================
// FILE: app/api/[[...route]]/route.ts (API Proxy) - DIPERBARUI
// ==============================================================================
// TUJUAN: Meneruskan semua request (GET, POST, PUT, DELETE) dari Next.js
//         ke Cloudflare Worker.

export const runtime = 'edge';

// Fungsi bantuan untuk meneruskan request, agar tidak mengulang kode
async function forwardRequest(request: Request) {
  const incomingUrl = new URL(request.url);
  
  const workerBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.CLOUDFLARE_WORKER_URL;

  if (!workerBaseUrl) {
    return new Response('Worker URL not configured', { status: 500 });
  }

  const finalWorkerUrl = new URL(incomingUrl.pathname, workerBaseUrl);
  finalWorkerUrl.search = incomingUrl.search;

  // Buat header baru dari request yang masuk
  const headers = new Headers(request.headers);
  // Atur header 'host' agar sesuai dengan tujuan worker
  headers.set('host', new URL(workerBaseUrl).host);

  return fetch(finalWorkerUrl.href, {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'manual',
  });
}

// Handler untuk berbagai metode HTTP
export async function GET(request: Request) {
  return forwardRequest(request);
}

export async function POST(request: Request) {
  return forwardRequest(request);
}

// PERBAIKAN: Tambahkan handler untuk metode PUT
export async function PUT(request: Request) {
  return forwardRequest(request);
}

// PERBAIKAN: Tambahkan handler untuk metode DELETE
export async function DELETE(request: Request) {
  return forwardRequest(request);
}

// Menambahkan handler lain untuk masa depan
export async function PATCH(request: Request) {
  return forwardRequest(request);
}
