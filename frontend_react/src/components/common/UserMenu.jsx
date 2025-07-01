import React from "react";
import { useMyChannelId } from "@/hooks/useMyChannelId";
import { useIsMobile } from "@/hooks/useIsMobile";
import LoginLinkButton from "@/components/common/LoginLinkButton";
import AvatarDropdown from "@/components/common/AvatarDropdown";

const UserMenu = () => {
  const { data: user, isLoading } = useMyChannelId();
  const isMobile = useIsMobile();

  if (isLoading) return null;

  if (!user?.channelId) {
    return isMobile ? null : <LoginLinkButton />;
  }

  return (
    <AvatarDropdown
      channelId={user.channelId}
      channelName={user.name}
      avatarUrl={user.thumbnail}
    />
  );
};

export default UserMenu;
