import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Northstar</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Loma Linda University Health — proof of concept. Synthetic data only.
        </p>
      </div>

      {session?.user ? (
        <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-6 dark:border-white/15">
          <div>
            <p className="text-sm text-black/60 dark:text-white/60">Signed in as</p>
            <p className="font-medium">{session.user.name ?? "Unknown"}</p>
            <p className="text-sm text-black/60 dark:text-white/60">
              {session.user.email ?? "no email claim"}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-md bg-[#0072c6] px-4 py-2 text-sm font-medium text-white hover:bg-[#005ea2]"
          >
            Sign in with Microsoft
          </button>
        </form>
      )}
    </main>
  );
}
