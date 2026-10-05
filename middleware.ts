export { proxy as middleware } from "./src/proxy";

export const config = {
  matcher: [
    "/admin/:path*",
    "/services",
    "/services/:path*",
  ],
};