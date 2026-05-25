"use client";

import {GameMode, GameUser} from "@leandrolescano/click-battle-core";
import dynamic from "next/dynamic";
import {ReactNode, useState} from "react";
import {useTranslation} from "react-i18next";

import {Button, Loading, SettingsSidebar} from "components-new";
import {GameHeader} from "components-new/GameHeader";
import {LoginModalProps} from "components-new/LoginModal/types";
import {useAuth} from "contexts/AuthContext";
import useGameTimer from "hooks/gameTimer";
import {useRoomGame} from "hooks/useRoomGame";
import {Game} from "interfaces";
import {DEFAULT_GAME_MODE} from "lib/game/gameModes";
import {getReactionWinner} from "lib/game/reactionBattle";

const OpponentSection = dynamic(
  () => import("../../../components-new/OpponentSection")
);
const LocalSection = dynamic(
  () => import("../../../components-new/LocalSection")
);
const CelebrationResult = dynamic(
  () => import("../../../components-new/CelebrationResult")
);
const ResultSection = dynamic(
  () => import("../../../components-new/ResultSection")
);
const ReactionBattle = dynamic(
  () => import("../../../components-new/ReactionBattle")
);
const LoginModal = dynamic<LoginModalProps>(
  () =>
    import("../../../components-new/LoginModal").then(
      (component) => component.LoginModal
    ),
  {
    ssr: false
  }
);

type ModeViewContext = {
  currentGame: Game;
  localUser: GameUser;
};

type ModeView = {
  renderContent: (context: ModeViewContext) => ReactNode;
  shouldShowRoomTitle: (game: Game) => boolean;
  usesClassicTimer: boolean;
  getShouldCelebrate: (context: ModeViewContext) => boolean | undefined;
};

const modeViews: Partial<Record<GameMode, ModeView>> = {
  "classic-speed": {
    usesClassicTimer: true,
    shouldShowRoomTitle: (game) => game.status !== "ended",
    getShouldCelebrate: () => undefined,
    renderContent: ({currentGame, localUser}) =>
      currentGame.status !== "ended" ? (
        <div className="flex min-w-0 flex-1 flex-col-reverse md:flex-row gap-4 md:gap-0 justify-end md:justify-start h-full min-h-0">
          <LocalSection idGame={currentGame.key || ""} localUser={localUser} />
          <OpponentSection
            localUsername={localUser?.username || ""}
            maxUsers={currentGame.settings.maxUsers}
          />
        </div>
      ) : (
        <ResultSection />
      )
  },
  reaction: {
    usesClassicTimer: false,
    shouldShowRoomTitle: () => true,
    getShouldCelebrate: ({currentGame, localUser}) => {
      const reactionWinner = getReactionWinner(
        currentGame.listUsers,
        currentGame.reactionSession?.results
      );

      return (
        currentGame.reactionSession?.status === "ended" &&
        Boolean(reactionWinner) &&
        (reactionWinner?.playerKey === localUser.key ||
          reactionWinner?.playerKey === localUser.username)
      );
    },
    renderContent: ({currentGame, localUser}) => (
      <ReactionBattle idGame={currentGame.key || ""} localUser={localUser} />
    )
  }
};

const getModeView = (mode?: GameMode | null) =>
  modeViews[mode || DEFAULT_GAME_MODE] || modeViews[DEFAULT_GAME_MODE]!;

const RoomGame = () => {
  const [showSideBar, setShowSideBar] = useState(false);
  const {t} = useTranslation();
  const {isAuthenticated, loading: authLoading} = useAuth();

  const {
    currentGame,
    localUser,
    isHost,
    roomStats,
    handleBackNavigation,
    handleInvite
  } = useRoomGame();
  const modeView = getModeView(currentGame?.gameMode);
  const shouldCelebrate = modeView.getShouldCelebrate({
    currentGame,
    localUser
  });

  const {countdown} = useGameTimer({
    disabled: !modeView.usesClassicTimer,
    roomStats
  });

  const closeSideBar = () => {
    if (showSideBar) {
      setShowSideBar(false);
    }
  };

  return (
    <main>
      <div className="dark:text-primary-200 h-dvh flex flex-col overflow-hidden relative">
        {authLoading || !currentGame ? (
          <Loading />
        ) : (
          <>
            {currentGame.status === "countdown" && (
              <div className="start-countdown text-8xl md:text-9xl">
                {countdown}
              </div>
            )}
            <CelebrationResult shouldCelebrate={shouldCelebrate} />
            {isHost && (
              <SettingsSidebar
                showSideBar={showSideBar}
                handleSideBar={(val: boolean) => setShowSideBar(val)}
                idGame={currentGame.key || ""}
                options={{
                  maxUsers: currentGame?.settings.maxUsers || 2,
                  roomName: currentGame?.roomName,
                  password: currentGame?.settings.password,
                  timer: currentGame?.settings.timer || 10
                }}
              />
            )}
            <div onClick={closeSideBar} className="flex flex-col gap-4 h-full">
              <GameHeader
                onOpenSettings={() => setShowSideBar(true)}
                onBack={handleBackNavigation}
              />
              {modeView.shouldShowRoomTitle(currentGame) ? (
                <h1 className="game-room-title text-2xl md:text-6xl text-center md:text-start font-bold mb-2 text-primary-400 dark:text-primary-100">
                  {currentGame?.roomName || ""}
                </h1>
              ) : null}
              {modeView.renderContent({currentGame, localUser})}
              <Button
                variant="outlined"
                className="text-xl md:text-2xl py-0.5 px-3 md:py-1 md:px-6 self-center md:self-end z-10"
                onClick={handleInvite}
              >
                {t("Invite friends")}
              </Button>
            </div>
            {!isAuthenticated && <LoginModal />}
          </>
        )}
      </div>
    </main>
  );
};

export default RoomGame;
