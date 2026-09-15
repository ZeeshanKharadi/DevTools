"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { getBusinessProfile } from "@/lib/pro/api";
import type { BusinessProfile } from "@/lib/pro/client";

export function ProfileFillButton({
  label,
  onProfile,
}: {
  label: string;
  onProfile: (profile: BusinessProfile) => void;
}) {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    void getBusinessProfile()
      .then((result) => setProfile(result.profile))
      .catch(() => setProfile(null));
  }, [user]);

  if (loading || !user || !profile) {
    return null;
  }

  const hasData = Boolean(
    profile.businessName || profile.name || profile.email || profile.phone,
  );
  if (!hasData) {
    return null;
  }

  return (
    <Button variant="ghost" onClick={() => onProfile(profile)}>
      {label}
    </Button>
  );
}
