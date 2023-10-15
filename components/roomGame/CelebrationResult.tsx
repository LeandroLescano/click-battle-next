import React from "react";
import {User} from "interfaces";

interface Props {
  celebrationContainer: React.LegacyRef<HTMLDivElement> | undefined;
  timer: number;
  listUsers: User[];
  localUser: User;
}

function CelebrationResult({
  celebrationContainer,
  timer,
  listUsers,
  localUser
}: Props) {
  return (
    <div
      ref={celebrationContainer}
      className={`position-absolute ${
        timer > 0
          ? "d-none"
          : listUsers.sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0]
              .username === localUser.username
          ? "d-block"
          : "d-none"
      } `}
      id="celebration"
    />
  );
}

export default CelebrationResult;
