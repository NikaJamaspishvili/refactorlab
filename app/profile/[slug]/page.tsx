import { fetchProfileInformation } from "./_serverFunctions/profile";
import ChooseProfileImage from "./_components/ChooseProfileImage";
import { fetchLeaderboardInfo } from "@/app/dashboard/_serverFunctions/leaderboard";
import {
  difficulties,
  dashboardSections,
  dashboardSectionsMapping,
} from "@/app/common";
type paramsType = Promise<{ slug: string }>;

const page = async ({ params }: { params: paramsType }) => {
  const newparams = await params;
  const userId = newparams.slug;

  const data = await fetchProfileInformation(userId);

  let finalData: any = {};

  for (const section of dashboardSections) {
    const leaderBoardInfo = await fetchLeaderboardInfo(section, difficulties);

    let total = 0;

    leaderBoardInfo.response.map((result: any) => {
      if (section === "HIGHEST_SCORE") {
        total += result.data[0]?.scoreSum ?? 0;
      } else if (section === "MOST_PROBLEMS_SOLVED") {
        total += result.data[0]?.solvedCount ?? 0;
      } else if (section === "MOST_PROBLEMS_TACKLED") {
        total += result.data[0]?.tackledCount ?? 0;
      }
    });

    finalData[section] = { total: total, array: leaderBoardInfo.response };
  }

  if (!data) return <h1>NO USERS FOUND</h1>;
  return (
    <div>
      <h1>{data.username}</h1>

      <ChooseProfileImage image={data.image} userId={userId} />

      {dashboardSections.map((section, index) => {
        return (
          <section key={index}>
            <h1>{dashboardSectionsMapping[section]}</h1>
            <div style={{ display: "flex", gap: "20px" }}>
              {finalData[section].array.map((result: any, index2: number) => {
                return (
                  <div key={index2}>
                    <h3>{result.difficulty}</h3>

                    <p>
                      {result.data[0]?.scoreSum ||
                        result.data[0]?.tackledCount ||
                        result.data[0]?.solvedCount ||
                        0}
                    </p>
                  </div>
                );
              })}
              <p>FINAL TOTAL: {finalData[section].total}</p>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default page;
