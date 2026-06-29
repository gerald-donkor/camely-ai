import { SignUp } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth/auth-shell"

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp
        signInUrl={
          process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"
        }
      />
    </AuthShell>
  )
}
