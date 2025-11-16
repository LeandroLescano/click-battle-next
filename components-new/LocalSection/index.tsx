import {AntiClickCheat} from "@leandrolescano/click-battle-core";
import {getAnalytics, logEvent} from "firebase/analytics";
import {getDatabase, ref, serverTimestamp, update} from "firebase/database";
import {useRouter} from "next/navigation";
import {useMemo, useRef, useState} from "react";
import {Trans, useTranslation} from "react-i18next";

import {Button} from "components-new/Button";
import {Card} from "components-new/Card";
import GoogleAdUnit from "components-new/CardGameAd/GoogleAdUnit";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {useWindowSize} from "hooks";
import useGameTimer from "hooks/gameTimer";
import {Watch} from "icons/Watch";
import {GameUser} from "interfaces";

interface LocalSectionProps {
  idGame: string;
  localUser: GameUser;
}

function LocalSection({idGame, localUser}: LocalSectionProps) {
  const router = useRouter();
  const db = getDatabase();
  const {user: gUser} = useAuth();
  const {t, i18n} = useTranslation();
  const [disableUI, setDisableUI] = useState(false);
  const {game, isHost} = useGame();
  const {remainingTime} = useGameTimer({});
  const {width} = useWindowSize();
  // 1000ms / 20 clicks = 50ms
  const antiCheat = useRef(new AntiClickCheat(50, 10));

  const showCountdown = game.status === "countdown";
  const start = game.status === "playing";
  const cantStart = !start && game.listUsers.length < 2;

  // function for start game
  const handleStart = () => {
    const refGame = ref(db, `games/${idGame}`);
    logEvent(getAnalytics(), "start_game", {
      action: "start_game",
      users: game.listUsers.length,
      date: new Date()
    });
    const startedGame = {
      status: "countdown",
      startTime: serverTimestamp()
    };
    update(refGame, startedGame);
  };

  const handleClick = () => {
    const {shouldKick, interval, suspicionCounter} =
      antiCheat.current.registerClick();

    console.log({interval, suspicionCounter});

    if (shouldKick) {
      setDisableUI(true);
      logEvent(getAnalytics(), "kicked_suspicion_hack", {
        action: "kicked_suspicion_hack",
        clickInterval: interval,
        suspicionCounter,
        date: new Date()
      });
      return router.push("/?suspicionOfHack=true");
    }

    if (localUser.clicks !== undefined && gUser) {
      const refGame = ref(db, `games/${idGame}/listUsers/${gUser.uid}`);
      update(refGame, {clicks: localUser.clicks + 1});
    }
  };

  const AdditionalInfo = () => {
    let text: string | React.ReactNode;
    if (cantStart) {
      text = <Trans i18nKey="twoPlayersRequired" components={{1: <br />}} />;
    }

    if (!isHost && !start && !showCountdown) {
      text = t(
        "The room is complete. All that remains is for the host to start the game - get ready to begin!"
      );
    }

    if (text) {
      return (
        <h5 className="text-2xl md:text-4xl text-center md:text-start mb-6 text-primary-500 dark:text-primary-100 max-w-md">
          {text}
        </h5>
      );
    }

    return null;
  };

  const importantInfo = useMemo<string>(() => {
    if (!start && !showCountdown) {
      if (isHost) {
        return t("Press start to play");
      }
      return t("Waiting for host...");
    }

    return t("You have n clicks", {clicks: localUser.clicks});
  }, [start, showCountdown, isHost, localUser.clicks, i18n.language]);

  return (
    <div className="w-full md:w-1/2 flex flex-col px-4 md:px-0">
      <h4 className="text-2xl md:text-5xl text-center md:text-start font-extrabold tracking-wide mb-4 md:mb-12 text-primary-600 dark:text-primary-200">
        {importantInfo}
      </h4>
      <AdditionalInfo />
      <div>
        {(!isHost || start || showCountdown) && (
          <Button
            className="text-xl md:text-4xl w-full md:w-9/12 px-3.5 md:px-5 py-3 md:py-4"
            disabled={!start || disableUI}
            onClick={handleClick}
          >
            Click
          </Button>
        )}
        {isHost && !start && !showCountdown && (
          <Button
            className="text-xl md:text-4xl w-full md:w-9/12 px-3.5 md:px-5 py-3 md:py-4"
            disabled={cantStart}
            onClick={handleStart}
          >
            {t("Start!")}
          </Button>
        )}
        <h2 className="flex items-center gap-3 md:gap-6 font-semibold text-3xl md:text-6xl mt-5 md:mt-10 justify-center md:justify-start">
          <Watch /> 00:{String(remainingTime).padStart(2, "0")}
        </h2>
      </div>
      {width > 768 && (
        <Card className="mt-auto mr-auto">
          <GoogleAdUnit>
            <ins
              className="adsbygoogle"
              style={{display: "inline-block", width: "384px", height: "125px"}}
              data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
              data-ad-slot="6440984608"
            ></ins>
          </GoogleAdUnit>
        </Card>
      )}
    </div>
  );
}

export default LocalSection;
