import Link from "next/link";
import RegisterForm from "./_components/register-form";

export default function RegisterPage() {
  return (
    <>
      <section className="m-4 sm:my-6 sm:mx-12 md:my-10 xl:my-16 2xl:my-22 pb-8 sm:pb-12 md:pb-16 xl:pb-22 2xl:pb-28 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 flex flex-col gap-12">
        <div className="flex flex-col gap-6 items-center">
          <h1 className="text-6xl lg:text-7xl font-serif text-center">
            Create your free account
          </h1>
          <RegisterForm />
          <p>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </section>
    </>
  );
}
