import Page from "./_components/Page";
import { auth } from "@/auth";
const page = async () => {
  const session = await auth(); // v5: await auth()

  const userSession = session?.user as { userId: string };
  return <Page userId={userSession.userId} />;
};

export default page;
