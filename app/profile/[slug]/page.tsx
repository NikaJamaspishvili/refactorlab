import { fetchProfileInformation } from "./_serverFunctions/profile";
import ChooseProfileImage from "./_components/ChooseProfileImage";
type paramsType = Promise<{ slug: string }>;

const page = async ({ params }: { params: paramsType }) => {
  const newparams = await params;
  const userId = newparams.slug;

  const data = await fetchProfileInformation(userId);

  if (!data) return <h1>NO USERS FOUND</h1>;
  return (
    <div>
      <h1>{data.username}</h1>
      <h2>{data.email}</h2>

      <ChooseProfileImage image={data.image} userId={userId} />
    </div>
  );
};

export default page;
