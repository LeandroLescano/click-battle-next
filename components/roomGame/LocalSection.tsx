import React, {useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {getDatabase, ref, update} from "firebase/database";
import {getAnalytics, logEvent} from "firebase/analytics";
import {useTranslation} from "react-i18next";

import {GameUser} from "interfaces";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";

interface LocalSectionProps {
  idGame: string;
  isLocal: boolean;
  localUser: GameUser;
  start: boolean;
  startCountdown: boolean;
}

function LocalSection({
  idGame,
  isLocal,
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
  const {game} = useGame();

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
        router.push("/?suspicionOfHack=true");
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
    <>
      {!start && !startCountdown ? (
        isLocal ? (
          <h4>{t("Press start to play")}</h4>
        ) : (
          <h4>{t("Waiting for host...")}</h4>
        )
      ) : (
        <h4>{t("You have n clicks!", {clicks: localUser.clicks})}</h4>
      )}
      <div className="d-flex justify-content-around gap-2">
        <button
          className="btn-click my-2"
          disabled={!start || disableUI}
          onClick={handleClick}
        >
          Click
        </button>
        {isLocal && !start && !startCountdown && (
          <button
            className="btn-click my-2"
            disabled={cantStart}
            onClick={handleStart}
          >
            {t("Start!")}
          </button>
        )}
      </div>
      <p className="mt-3 mb-0">{localUser.username}</p>
      {cantStart && (
        <sub>{t("This game requires at least 2 players. Grab a friend!")}</sub>
      )}
    </>
  );
}

export default LocalSection;
