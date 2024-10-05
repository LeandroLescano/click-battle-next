/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";
import React, {Fragment, useEffect, useState} from "react";
import Swal from "sweetalert2";
import {useTranslation} from "react-i18next";
import {getAnalytics, logEvent} from "firebase/analytics";
import {useRouter, useSearchParams} from "next/navigation";
import {child, getDatabase, onValue, ref, set} from "@firebase/database";
import dynamic from "next/dynamic";

import {Game, GameUser} from "interfaces";
import {requestPassword} from "components";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {Header, Footer, CardGame, CardGameAd, Loading} from "components-new";
import {CreateSection} from "components-new/CreateSection";
import {LoginModalProps} from "components-new/LoginModal/types";
import {NotificationModal} from "components-new/NotificationModal";
import {NotificationType} from "components-new/NotificationModal/types";
import {WelcomeMessage} from "components-new/WelcomeMessage";

const LoginModal = dynamic<LoginModalProps>(
  () =>
    import("../../../components-new/LoginModal").then(
      (component) => component.LoginModal
    ),
  {
    ssr: false
  }
);

const Home = () => {
  const [listGames, setListGames] = useState<Game[]>([]);
  const [notificationModal, setNotificationModal] = useState<{
    show: boolean;
    type: NotificationType;
  }>({
    show: false,
    type: "fullRoom"
  });

  const router = useRouter();
  const params = useSearchParams();
  const db = getDatabase();
  const {gameUser, user, loading} = useAuth();
  const {resetGame, setGame} = useGame();
  const {t} = useTranslation();

  useEffect(() => {
    //If exist userKey get user from DB
    if (params.get("kickedOut") === "true") {
      router.replace("/new");
      setNotificationModal({
        show: true,
        type: "kickedOut"
      });
    } else if (params.get("fullRoom") === "true") {
      router.replace("/new");
      setNotificationModal({
        show: true,
        type: "fullRoom"
      });
    } else if (params.get("suspicionOfHack") === "true") {
      router.replace("/new");
      setNotificationModal({
        show: true,
        type: "hacks"
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    //Get rooms of games from DB
    if (gameUser?.username) {
      resetGame();
      const refGames = ref(db, `games`);
      onValue(refGames, (snapshot) => {
        const list: {[key: string]: Game} | null = snapshot.val();
        if (list) {
          if (mounted) {
            const games = Object.entries(list).map((game) => ({
              key: game[0],
              ...game[1]
            }));

            for (const g of games) {
              if (g.listUsers) {
                g.listUsers = Object.entries(g.listUsers).map((u) => ({
                  key: u[0],
                  ...u[1]
                }));
              }
            }

            setListGames(games);
          }
        } else {
          setListGames([]);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [gameUser?.username]);

  //Function for enter room
  const handleEnterGame = (game: Game) => {
    try {
      if (game.key) {
        if (Object.keys(game.listUsers).length === game.settings.maxUsers) {
          Swal.fire({
            icon: "warning",
            title: t("Room is full"),
            toast: true,
            showConfirmButton: false,
            position: "bottom-end",
            timer: 3000
          });
        } else {
          if (game.settings.password) {
            requestPassword(game.settings.password, t).then((val) => {
              if (game.key && val.isConfirmed) {
                configRoomToEnter(game);
              }
            });
          } else {
            configRoomToEnter(game);
          }
        }
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: t("Ups! We couldn't enter the room, please try again."),
        timer: 3000,
        timerProgressBar: true,
        heightAuto: false
      });
    }
  };

  //Function for add actualGameID to sessionStorage and add new user to game in database
  const configRoomToEnter = (game: Game) => {
    if (
      game.key &&
      game.ownerUser &&
      gameUser &&
      game.ownerUser.username !== gameUser.username
    ) {
      setGame(game);
      if (user?.uid) {
        const userToPush: GameUser = {
          username: gameUser.username,
          clicks: 0,
          rol: "visitor"
        };
        if (gameUser.maxScores) {
          userToPush.maxScores = gameUser.maxScores;
        }
        const refGame = ref(db, `games/${game.key}/listUsers`);
        const childRef = child(refGame, user.uid);
        set(childRef, userToPush);
        logEvent(getAnalytics(), "enter_room", {
          action: "enter_room",
          withCustomName: !!game.roomName,
          withPassword: !!game.settings.password,
          maxUsers: game.settings.maxUsers,
          isRegistered: !user.isAnonymous
        });
        router.push(`/new/game/${game.key}`);
      } else {
        console.error("Error loading user to game");
      }
    }
  };

  if (loading) return <Loading />;

  return (
    <main>
      <div className="text-primary-200 h-dvh flex flex-col gap-4 md:gap-0">
        <Header />
        <div className="flex flex-col md:flex-row-reverse w-full md:gap-4 lg:gap-0 flex-1 p-md-0 overflow-hidden">
          <div className="md:w1/2 lg:w-1/3 flex flex-col md:max-h-[480px]">
            <div className="md:hidden">
              <WelcomeMessage />
            </div>
            <CreateSection />
          </div>
          <div className="flex flex-col justify-start items-start lg:w-2/3 order-md-0 md:max-w-[73%] md:min-w-[560px] relative pl-1 min-h-0">
            <div className="hidden md:block">
              <WelcomeMessage />
            </div>
            <h3 className="text-base md:text-4xl font-bold mt-2 md:mt-0 md:mb-8 text-primary-600 dark:text-primary-100">
              {t("Available rooms")}
            </h3>
            <div className="games-container grid grid-cols-2 gap-6 p-2 overflow-y-auto overflow-x-hidden w-full md:w-fit">
              {listGames.length > 0
                ? listGames.map((game, i) => (
                    <Fragment key={i}>
                      <CardGame
                        game={game}
                        roomNumber={i}
                        handleEnterGame={() => handleEnterGame(game)}
                      />
                      {(listGames.length === 1 ||
                        (i !== 0 &&
                          (i % 4 === 0 || i === listGames.length - 1))) && (
                        <CardGameAd />
                      )}
                    </Fragment>
                  ))
                : gameUser?.username && <CardGameAd />}
            </div>
          </div>
        </div>
        <Footer />
      </div>
      <LoginModal />
      <NotificationModal
        show={notificationModal.show}
        onClose={() =>
          setNotificationModal({...notificationModal, show: false})
        }
        type={notificationModal.type}
      />
    </main>
  );
};

export default Home;
