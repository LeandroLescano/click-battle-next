import React, {useMemo, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {getDatabase, ref, update} from "firebase/database";
import {getAnalytics, logEvent} from "firebase/analytics";
import {Trans, useTranslation} from "react-i18next";

import {GameUser} from "interfaces";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {Button} from "components-new/Button";
import {Watch} from "icons/Watch";
import {Card} from "components-new/Card";
import GoogleAdUnit from "components-new/CardGameAd/GoogleAdUnit";

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

  const AdditionalInfo = () => {
    if (cantStart) {
      return <Trans i18nKey="twoPlayersRequired" components={{1: <br />}} />;
    }

    if (!isHost && !start && !startCountdown) {
      return (
        <>
          {t(
            "The room is complete. All that remains is for the host to start the game - get ready to begin!"
          )}
        </>
      );
    }

    return null;
  };

  const importantInfo = useMemo<string>(() => {
    if (!start && !startCountdown) {
      if (isHost) {
        return t("Press start to play");
      }
      return t("Waiting for host...");
    }

    return t("You have n clicks", {clicks: localUser.clicks});
  }, [start, startCountdown, isHost, localUser.clicks]);

  return (
    <div className="w-1/2 flex flex-col">
      <h4 className="text-5xl font-extrabold tracking-wide mb-12 text-primary-600 dark:text-primary-200">
        {importantInfo}
      </h4>
      <h5 className="text-4xl mb-6 text-primary-500 dark:text-primary-100 max-w-md">
        <AdditionalInfo />
      </h5>
      <div>
        {(!isHost || start || startCountdown) && (
          <Button
            className="text-4xl w-96 px-5 py-4"
            disabled={!start || disableUI}
            onClick={handleClick}
          >
            Click
          </Button>
        )}
        {isHost && !start && !startCountdown && (
          <Button
            className="text-4xl w-96 px-5 py-4"
            disabled={cantStart}
            onClick={handleStart}
          >
            {t("Start!")}
          </Button>
        )}
        {game?.timer !== undefined && game.currentGame && (
          <h2 className="flex gap-6 font-semibold text-6xl mt-10">
            <Watch /> 00:{String(game?.timer).padStart(2, "0")}
          </h2>
        )}
      </div>
      <Card className="mt-auto mr-auto">
        <GoogleAdUnit>
          <ins
            className="adsbygoogle"
            style={{display: "inline-block", width: "384px", height: "118px"}}
            data-ad-client="ca-pub-4229101464965146"
            data-ad-slot="6440984608"
          ></ins>
        </GoogleAdUnit>
      </Card>
    </div>
  );
}

export default LocalSection;
