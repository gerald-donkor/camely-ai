import { SignIn } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth/auth-shell"

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        signUpUrl={
          process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up"
        }
      />
    </AuthShell>
  )
}
