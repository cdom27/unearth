import Link from "next/link";
import RegisterForm from "./_components/register-form";

export default function RegisterPage() {
  return (
    <section className="mx-auto mt-4 flex w-full max-w-104 flex-col px-5 sm:mt-6 md:mt-10 xl:mt-16 2xl:mt-22">
      <h1 className="mb-8 text-center font-serif text-3xl leading-tight">
        Create your free account
      </h1>
      <RegisterForm />
      <p className="mt-6 text-center">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold underline underline-offset-2"
        >
          Log in
        </Link>
      </p>
    </section>
  );
}
