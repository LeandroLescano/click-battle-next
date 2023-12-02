import React from "react";
import {GameUser} from "interfaces";

interface Props {
  celebrationContainer: React.LegacyRef<HTMLDivElement> | undefined;
  timer: number | undefined;
  listUsers: GameUser[];
  localUser: GameUser;
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
        timer && timer > 0
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
