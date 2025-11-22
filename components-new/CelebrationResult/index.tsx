import React from "react";

import {useGame} from "contexts/GameContext";

interface Props {
  celebrationContainer: React.LegacyRef<HTMLDivElement> | undefined;
}

function CelebrationResult({celebrationContainer}: Props) {
  const {finalResults, game} = useGame();

  return (
    <div
      ref={celebrationContainer}
      className={`absolute bottom-0 mx-auto left-0 h-full md:w-full scale-[4] md:scale-100 overflow-hidden ${
        game.status !== "ended"
          ? "hidden"
          : finalResults?.localPosition === 1
          ? "block"
          : "hidden"
      }`}
      id="celebration"
    />
  );
}
export default CelebrationResult;
