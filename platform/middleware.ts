import { NextRequest, NextResponse } from "next/server";

// Use Node.js runtime instead of Edge runtime
export const runtime = "nodejs";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle CORS preflight requests for all API routes
  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, x-api-key",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // ALL /api/* routes handle their own JWT Bearer authentication — skip NextAuth check
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // For Next.js app pages (not used by the HTML frontend), we do nothing special here.
  // The Next.js app pages can use their own auth checks via lib/auth.ts if needed.
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
