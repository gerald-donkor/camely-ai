import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server"

function authRoutePattern(value: string | undefined, fallback: string) {
  const pathname = value
    ? new URL(value, "http://clerk.local").pathname
    : fallback

  return `${pathname.replace(/\/$/, "")}(.*)`
}

const isPublicRoute = createRouteMatcher([
  authRoutePattern(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL, "/sign-in"),
  authRoutePattern(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL, "/sign-up"),
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
}
