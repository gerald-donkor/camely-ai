## Resolved: logout RSC navigation failure

When the logout button was clicked, the following error appeared:

[browser] Clerk: Clerk has been loaded with development keys. Development instances have strict usage limits and should not be used when deploying your application to production. Learn more: https://clerk.com/docs/deployments/overview (https://central-oarfish-91.clerk.accounts.dev/npm/@clerk/clerk-js@6/dist/clerk.browser.js:12:6092)
 POST /editor 200 in 98ms (next.js: 9ms, proxy.ts: 21ms, application-code: 69ms)
  └─ ƒ invalidateCacheAction() in 9ms node_modules/@clerk/nextjs/dist/esm/app-router/server-actions.js
[browser] Failed to fetch RSC payload for http://localhost:3000/. Falling back to browser navigation. TypeError: Failed to fetch

### Root cause

Clerk's default post-sign-out destination was `/`. Because `/` is protected by
`proxy.ts`, the newly signed-out RSC request was redirected again to `/sign-in`
during the auth-state transition.

### Resolution

`ClerkProvider` now sends users directly to the public sign-in route after
logout. Sign-in and sign-up fallback redirects also go directly to `/editor`,
avoiding unnecessary redirects through `/`.

The development-key message is an expected local-development warning and is
not part of the navigation failure.


## Resolved: browser-extension hydration warning

Whenever a user signed in, the following message appeared on the Next.js
development error screen:

## Error Type
Console Error

## Error Message
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SegmentViewNode type="layout" pagePath="layout.tsx">
      <SegmentTrieNode>
      <link>
      <script>
      <script>
      <script>
      <RootLayout>
        <ClerkProvider>
          <ClientClerkProvider afterSignOutUrl="/sign-in" signInFallbackRedirectUrl="/editor" ...>
            ...
              <ClerkProvider afterSignOutUrl="/sign-in" signInFallbackRedirectUrl="/editor" ...>
                <ClerkProviderBase afterSignOutUrl="/sign-in" signInFallbackRedirectUrl="/editor" ...>
                  <ClerkContextProvider initialState={undefined} clerk={{clerkjs:null, ...}} clerkStatus="loading">
                    <InitialStateProvider initialState={undefined}>
                      <__experimental_CheckoutProvider value={undefined}>
                        <RouterTelemetry>
                        <ClerkScripts>
                        <html lang="en" className="geist_a715...">
                          <body
                            className="min-h-full flex flex-col"
-                           data-new-gr-c-s-check-loaded="14.1306.0"
-                           data-gr-ext-installed=""
                          >



    at body (<anonymous>:null:null)
    at RootLayout (app/layout.tsx:60:9)

## Code Frame
  58 |         className={`${geistSans.variable} ${geistMono.varia...
  59 |       >
> 60 |         <body className="min-h-full flex flex-col">{childre...
     |         ^
  61 |       </html>
  62 |     </ClerkProvider>
  63 |   );

Next.js version: 16.2.9 (Turbopack)

### Root cause

The Grammarly browser extension injected `data-new-gr-c-s-check-loaded` and
`data-gr-ext-installed` onto `<body>` after the server rendered the document
but before React hydrated it. The application did not render those attributes,
so React correctly reported that the server and browser DOM differed.

### Resolution

The root `<body>` now uses React's narrowly scoped
`suppressHydrationWarning` escape hatch. This suppresses direct attribute
mismatches on that element while leaving hydration warnings in the application
component tree visible.

Disabling Grammarly for localhost or testing in an extension-free browser
profile remains the preferred way to verify whether future hydration warnings
come from application code.
