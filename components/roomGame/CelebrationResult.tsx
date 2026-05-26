import {GameUser} from "@leandrolescano/click-battle-core";
import React from "react";

import {useGame} from "contexts/GameContext";

interface Props {
  celebrationContainer: React.LegacyRef<HTMLDivElement> | undefined;
  timer: number | undefined;
  localUser: GameUser;
}

function CelebrationResult({celebrationContainer, timer, localUser}: Props) {
  const {game} = useGame();

  return (
    <div
      ref={celebrationContainer}
      className={`position-absolute ${
        timer && timer > 0
          ? "d-none"
          : game.listUsers.sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0]
              ?.username === localUser?.username
          ? "d-block"
          : "d-none"
      } `}
      id="celebration"
    />
  );
}

export default CelebrationResult;
