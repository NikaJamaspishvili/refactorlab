import { LeetCodeDashboard } from "@/app/_components/LeetCodeDashboard";
import { queryInitialExerciseData } from "@/app/api/analyse/DbLogic";
import { auth } from "@/auth";
import { QueryInitialExerciseData } from "@/app/api/analyse/DbLogic";
type Params = Promise<{ exerciseId: string }>;

const page = async ({ params }: { params: Params }) => {
  const { exerciseId } = await params;
  const userSession = (await auth())?.user as { userId: string };

  const initialData: QueryInitialExerciseData = await queryInitialExerciseData(
    Number(exerciseId),
    userSession.userId,
  );

  return <LeetCodeDashboard initialData={initialData} />;
};

export default page;
