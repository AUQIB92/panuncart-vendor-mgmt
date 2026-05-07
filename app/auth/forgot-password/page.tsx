import ForgotPasswordClient from "@/app/auth/forgot-password/ForgotPasswordClient"

type ForgotPasswordPageProps = {
  searchParams?: {
    returnTo?: string | string[]
  }
}

export default function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const returnTo = Array.isArray(searchParams?.returnTo)
    ? searchParams?.returnTo[0]
    : searchParams?.returnTo

  return <ForgotPasswordClient initialReturnTo={returnTo} />
}
