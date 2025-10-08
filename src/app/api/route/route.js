import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('session');
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function GET() {
  return Response.json({ message: 'Hello from App Router API!' });
}

