import React, {useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {getDatabase, ref, update} from "firebase/database";
import {getAnalytics, logEvent} from "firebase/analytics";
import {Trans, useTranslation} from "react-i18next";

import {GameUser} from "interfaces";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {Button} from "components-new/Button";

interface LocalSectionProps {
  idGame: string;
  localUser: GameUser;
  start: boolean;
  startCountdown: boolean;
}

function LocalSection({
  idGame,
  localUser,
  start,
  startCountdown
}: LocalSectionProps) {
  const [lastClickTime, setLastClickTime] = useState<number>();
  const router = useRouter();
  const db = getDatabase();
  const {user: gUser} = useAuth();
  const suspicionOfHackCounter = useRef(0);
  const {t} = useTranslation();
  const [disableUI, setDisableUI] = useState(false);
  const {game, isHost} = useGame();

  const cantStart = !start && game.listUsers.length < 2;

  // function for start game
  const handleStart = () => {
    const refGame = ref(db, `games/${idGame}`);
    logEvent(getAnalytics(), "start_game", {
      action: "start_game",
      users: game.listUsers.length,
      date: new Date()
    });
    update(refGame, {gameStart: true});
  };

  const handleClick = () => {
    const now = Date.now();

    // 1000ms / 25 clicks = 40ms
    if (lastClickTime && now - lastClickTime < 40) {
      suspicionOfHackCounter.current++;
      if (suspicionOfHackCounter.current >= 5) {
        setDisableUI(true);
        logEvent(getAnalytics(), "kicked_suspicion_hack", {
          action: "kicked_suspicion_hack",
          clickInterval: now - lastClickTime,
          date: new Date()
        });
        router.push("/new/?suspicionOfHack=true");
        return;
      }
    }

    if (localUser.clicks !== undefined && gUser) {
      setLastClickTime(now);
      const refGame = ref(db, `games/${idGame}/listUsers/${gUser.uid}`);
      update(refGame, {clicks: localUser.clicks + 1});
    }
  };

  return (
    <div className="w-1/2">
      {!start && !startCountdown ? (
        <h4 className="text-5xl font-extrabold tracking-wide">
          {isHost ? t("Press start to play") : t("Waiting for host...")}
        </h4>
      ) : (
        <h4>{t("You have n clicks!", {clicks: localUser.clicks})}</h4>
      )}
      <h5 className="text-4xl">
        {cantStart ? (
          <Trans i18nKey="twoPlayersRequired" components={{1: <br />}} />
        ) : null}
      </h5>
      <div className="d-flex justify-content-around gap-2">
        {(!isHost || start || startCountdown) && (
          <Button
            className="text-4xl w-96 p-5"
            disabled={!start || disableUI}
            onClick={handleClick}
          >
            Click
          </Button>
        )}
        {isHost && !start && !startCountdown && (
          <Button
            className="text-4xl w-96 p-5"
            disabled={cantStart}
            onClick={handleStart}
          >
            {t("Start!")}
          </Button>
        )}
      </div>
    </div>
  );
}

export default LocalSection;
