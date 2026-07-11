import { NextResponse, type NextRequest } from "next/server";
import { resolveLivGeoEdgeMiddleware } from "@/lib/enterprise/liv-golf/geo/edge-middleware";
import { proxy } from "./proxy";

export async function middleware(request: NextRequest) {
  const edgeResult = resolveLivGeoEdgeMiddleware(request);

  if (edgeResult.action === "block") {
    return NextResponse.json(edgeResult.body, { status: edgeResult.status });
  }

  if (edgeResult.action === "forward") {
    return NextResponse.next({
      request: {
        headers: edgeResult.headers,
      },
    });
  }

  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return proxy(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/enterprise/liv-golf/micro-bets/place",
    "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|tenant-default).*)",
  ],
};
