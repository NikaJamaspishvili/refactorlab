import { signIn, signOut, auth } from "@/auth";

export default async function AuthButtons() {
  const session = await auth();
  if (session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <span>Welcome, {session.user.name}</span>
        <button type="submit">Sign out</button>
      </form>
    );
  }
  return (
    <div>
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button type="submit">Sign in with Google</button>
      </form>
      <form
        action={async () => {
          "use server";
          await signIn("github");
        }}
      >
        <button type="submit">Sign in with GitHub</button>
      </form>
    </div>
  );
}
