import Page from "./_components/Page";
import { auth } from "@/auth";
import { FetchAllExercisesData } from "./_serverFunctions/allexercises";
const PageContainer = async () => {
  const session = await auth(); // v5: await auth()

  const exercisesData = await FetchAllExercisesData({
    DIFFICULTY: "ALL",
    TITLE: "",
    PROBLEM_STATUS: "ALL",
  });

  const userSession = session?.user as { userId?: string } | undefined;

  return <Page exerciseData={exercisesData} userId={userSession?.userId} />;
};

export default PageContainer;
