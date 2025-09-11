// app/profile/ProfileClient.tsx — SERVER component (veilig i.v.m. ProfileSummary)
import { Suspense } from "react";
import Link from "next/link";

import PhotoUploader from "@/components/profile/PhotoUploader";
import ProfileSummary from "@/components/profile/ProfileSummary";
import UsernameForm from "@/components/profile/UsernameForm";
import MyDishesManager from "@/components/profile/MyDishesManager";
import OrderList from "@/components/profile/OrderList";
import FavoritesGrid from "@/components/profile/FavoritesGrid";
import FollowsList from "@/components/profile/FollowsList";

export default function ProfileClient({ openNewProducts }: { openNewProducts: boolean }) {
  return (
    <div className="max-w-2xl mx-auto py-4">
      <ProfileSummary stacked />
      {/* Andere profielcomponenten kunnen hier worden toegevoegd */}
    </div>
  );
}
