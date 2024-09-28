import React from "react";
import {GameUser} from "interfaces";
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
      className={`absolute bottom-0 mx-auto left-0 h-full ${
        timer && timer > 0
          ? "hidden"
          : game.listUsers.sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0]
              .username === localUser.username
          ? "block"
          : "hidden"
      }`}
      id="celebration"
    />
  );
}
export default CelebrationResult;
