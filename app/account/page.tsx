import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/app/_lib/auth/server";
import SignOutButton from "./_components/sign-out-button";
import ResendVerificationLink from "@/app/_components/auth/resend-verification-link";
import ChangePasswordForm from "./_components/change-password-form";

const placeholderImage = "https://placehold.co/100/E74C3C/FFFFFF?text=Usr";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <section className="mx-auto mt-4 flex w-full max-w-200 flex-col px-5 sm:mt-6 md:mt-10 xl:mt-16 2xl:mt-22">
      <h1 className="mb-16 text-center font-serif text-3xl leading-tight">
        Your Account
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src={session.user.image || placeholderImage}
            alt={`${session.user.name}'s profile image`}
            width={100}
            height={100}
            unoptimized
            className="size-25 rounded-full object-cover"
          />
          <p className="text-lg font-medium">{session.user.name}</p>
          <p>{session.user.email}</p>
          {!session.user.emailVerified && (
            <div className="flex flex-col items-center gap-2">
              <p>Your email address is not verified.</p>
              <ResendVerificationLink email={session.user.email} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <ChangePasswordForm />
          <SignOutButton />
        </div>
      </div>
    </section>
  );
}
