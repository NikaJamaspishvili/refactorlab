"use server";
import AuthButtons from "../components/auth-buttons";
async function page() {
  return (
    <div>
      <AuthButtons />
    </div>
  );
}

export default page;
