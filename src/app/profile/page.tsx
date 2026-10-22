import type { Metadata } from "next";

import { ProfileScreen } from "@/components/profile-screen";

export const metadata: Metadata = {
  title: "Your shelf",
};

export default function ProfilePage() {
  return <ProfileScreen />;
}
