import {
  dashboardSections,
  dashboardSectionsMapping,
  difficulties,
} from "@/app/common";
import { fetchLeaderboardInfo } from "@/app/dashboard/_serverFunctions/leaderboard";
import ChooseProfileImage from "./_components/ChooseProfileImage";
import { fetchProfileInformation } from "./_serverFunctions/profile";

type Params = Promise<{ slug: string }>;
type DashboardSection = (typeof dashboardSections)[number];

type LeaderboardRow = {
  scoreSum?: number;
  solvedCount?: number;
  tackledCount?: number;
};

type LeaderboardBucket = {
  difficulty: string;
  data: LeaderboardRow[];
};

function getSectionValue(section: DashboardSection, row?: LeaderboardRow) {
  if (!row) {
    return 0;
  }

  if (section === "HIGHEST_SCORE") {
    return row.scoreSum ?? 0;
  }

  if (section === "MOST_PROBLEMS_SOLVED") {
    return row.solvedCount ?? 0;
  }

  return row.tackledCount ?? 0;
}

async function loadSectionData(section: DashboardSection, userId: string) {
  const leaderboardInfo = await fetchLeaderboardInfo(section, difficulties, userId);
  const buckets = leaderboardInfo.response as LeaderboardBucket[];

  const total = buckets.reduce((sum, bucket) => {
    return sum + getSectionValue(section, bucket.data[0]);
  }, 0);

  return [section, { total, buckets }] as const;
}

const Page = async ({ params }: { params: Params }) => {
  const { slug: userId } = await params;
  const profile = await fetchProfileInformation(userId);

  if (!profile) {
    return <h1>NO USERS FOUND</h1>;
  }

  const sectionEntries = await Promise.all(
    dashboardSections.map((section) => loadSectionData(section, userId)),
  );

  const sectionData = Object.fromEntries(sectionEntries) as Record<
    DashboardSection,
    {
      total: number;
      buckets: LeaderboardBucket[];
    }
  >;

  return (
    <div>
      <h1>{profile.username}</h1>

      <ChooseProfileImage image={profile.image} userId={userId} />

      {dashboardSections.map((section) => (
        <section key={section}>
          <h1>{dashboardSectionsMapping[section]}</h1>
          <div style={{ display: "flex", gap: "20px" }}>
            {sectionData[section].buckets.map((bucket) => (
              <div key={`${section}-${bucket.difficulty}`}>
                <h3>{bucket.difficulty}</h3>
                <p>{getSectionValue(section, bucket.data[0])}</p>
              </div>
            ))}
            <p>FINAL TOTAL: {sectionData[section].total}</p>
          </div>
        </section>
      ))}
    </div>
  );
};

export default Page;
