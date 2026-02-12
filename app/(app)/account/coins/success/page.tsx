import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import CoinsSuccessContent from "./coins-success-content";

export default async function CoinsSuccessPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return <CoinsSuccessContent />;
}
