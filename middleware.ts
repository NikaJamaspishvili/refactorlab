export { auth as middleware } from "@/auth";
export const config = {
  // Protect all routes under /dashboard and /profile
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
