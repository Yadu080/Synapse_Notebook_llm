import { NextRequest, NextResponse } from 'next/server';

const backendBaseUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8080';

const buildHeaders = (request: NextRequest) => {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');

  if (contentType) {
    headers.set('content-type', contentType);
  }

  return headers;
};

const forward = async (request: NextRequest, pathParts: string[]) => {
  const path = pathParts.join('/');
  const query = request.nextUrl.search || '';
  const targetUrl = `${backendBaseUrl}/api/${path}${query}`;

  const init: RequestInit = {
    method: request.method,
    headers: buildHeaders(request),
    cache: 'no-store',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, init);
    const contentType = response.headers.get('content-type') || 'application/json';
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': contentType,
      },
    });
  } catch {
    return NextResponse.json(
      { message: `Proxy could not reach backend at ${backendBaseUrl}.` },
      { status: 502 },
    );
  }
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forward(request, path);
}
