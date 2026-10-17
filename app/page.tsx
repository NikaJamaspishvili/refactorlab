"use server";

import { LeetCodeDashboard } from "./_components/LeetCodeDashboard";

export type UserSession = { userId?: string } | undefined;

export default async function Home() {
  return <LeetCodeDashboard />;
}
