import ResetPasswordForm from "./_components/reset-password-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{
    token?: string | string[];
    error?: string | string[];
  }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  const hasError = typeof params.error === "string";

  return (
    <section className="mx-auto mt-4 flex w-full max-w-104 flex-col px-5 sm:mt-6 md:mt-10 xl:mt-16 2xl:mt-22">
      <h1 className="mb-8 text-center font-serif text-3xl leading-tight">
        Reset your password
      </h1>
      <ResetPasswordForm token={hasError ? null : token} />
    </section>
  );
}
