import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CoinsContent } from "./coins-content";

export default async function CoinsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return <CoinsContent />;
}
