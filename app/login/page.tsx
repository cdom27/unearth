import Link from "next/link";
import LoginForm from "./_components/login-form";

export default function LoginPage() {
  return (
    <section className="mx-auto mt-4 flex w-full max-w-104 flex-col px-5 sm:mt-6 md:mt-10 xl:mt-16 2xl:mt-22">
      <h1 className="mb-8 text-center font-serif text-3xl leading-tight">
        Enter your email to sign in
      </h1>
      <LoginForm />
      <p className="mt-6 text-center">
        Don’t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold underline underline-offset-2"
        >
          Create one
        </Link>
      </p>
    </section>
  );
}
