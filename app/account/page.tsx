import { redirect } from "next/navigation";
import { getSession } from "@/app/_lib/auth/server";
import SignOutButton from "./sign-out-button";
import ResendVerificationLink from "@/app/_components/auth/resend-verification-link";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <section className="m-4 sm:my-6 sm:mx-12 md:my-10 xl:my-16 2xl:my-22 pb-8 sm:pb-12 md:pb-16 xl:pb-22 2xl:pb-28 lg:mx-18 xl:mx-24 2xl:mx-auto 2xl:max-w-325 flex flex-col gap-12">
        <div className="flex flex-col gap-6 items-center">
          <h1 className="text-6xl lg:text-7xl font-serif text-center">
            Account
          </h1>
          <p>{session.user.name}</p>
          <p>{session.user.email}</p>
          {!session.user.emailVerified && (
            <>
              <p>Your email address is not verified.</p>
              <ResendVerificationLink email={session.user.email} />
            </>
          )}
          <SignOutButton />
        </div>
      </section>
    </>
  );
}
