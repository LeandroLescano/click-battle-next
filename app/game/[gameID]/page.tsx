"use client";

import lottie from "lottie-web";
import dynamic from "next/dynamic";
import {useRef, useState} from "react";
import {useTranslation} from "react-i18next";

import {Button, Loading, SettingsSidebar} from "components-new";
import {GameHeader} from "components-new/GameHeader";
import {LoginModalProps} from "components-new/LoginModal/types";
import {useAuth} from "contexts/AuthContext";
import useGameTimer from "hooks/gameTimer";
import {useRoomGame} from "hooks/useRoomGame";
import celebrationAnim from "lotties/celebrationAnim.json";

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
const LoginModal = dynamic<LoginModalProps>(
  () =>
    import("../../../components-new/LoginModal").then(
      (component) => component.LoginModal
    ),
  {
    ssr: false
  }
);

const RoomGame = () => {
  const [showSideBar, setShowSideBar] = useState(false);
  const celebrationContainer = useRef<HTMLDivElement>(null);
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

  const {countdown} = useGameTimer({
    roomStats,
    onFinish: () => {
      if (celebrationContainer?.current?.innerHTML === "") {
        lottie.loadAnimation({
          container: celebrationContainer.current!,
          animationData: celebrationAnim
        });
      }
    }
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
            <CelebrationResult celebrationContainer={celebrationContainer} />
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
              {currentGame.status !== "ended" ? (
                <h1 className="text-2xl md:text-6xl text-center md:text-start font-bold mb-2 text-primary-400 dark:text-primary-100">
                  {currentGame?.roomName || ""}
                </h1>
              ) : null}
              {currentGame.status !== "ended" ? (
                <div className="flex min-w-0 flex-1 flex-col-reverse md:flex-row gap-4 md:gap-0 justify-end md:justify-start h-full min-h-0">
                  <LocalSection
                    idGame={currentGame.key || ""}
                    localUser={localUser}
                  />
                  <OpponentSection
                    localUsername={localUser?.username || ""}
                    maxUsers={currentGame.settings.maxUsers}
                  />
                </div>
              ) : (
                <ResultSection />
              )}
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
