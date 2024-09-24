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
import {requestPassword, Loading} from "components";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";
import {Header, Footer, CardGame, CardGameAd} from "components-new";
import {CreateSection} from "components-new/CreateSection";
import {Transition} from "@headlessui/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClose} from "@fortawesome/free-solid-svg-icons";
import {LoginModalProps} from "components-new/LoginModal/types";

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
  const [showMessage, setShowMessage] = useState(false);

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
      //TODO: Add a global Swal mixin with heightAuto:false
      Swal.fire({
        title: t("You were kicked out by the owner"),
        icon: "error",
        confirmButtonText: "Ok",
        heightAuto: false
      });
    } else if (params.get("fullRoom") === "true") {
      router.replace("/new");
      Swal.fire({
        title: t("Room is full"),
        icon: "error",
        confirmButtonText: "Ok",
        heightAuto: false
      });
    } else if (params.get("suspicionOfHack") === "true") {
      router.replace("/new");
      Swal.fire({
        title: t("Fair play is important to us"),
        text: t(
          "Please refrain from using unauthorized tools or hacks while playing."
        ),
        icon: "warning",
        confirmButtonText: "Ok",
        heightAuto: false
      });
    }

    if (!localStorage?.getItem("welcomeMessage")) {
      setShowMessage(true);
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

  const handleCloseMessage = () => {
    localStorage?.setItem("welcomeMessage", "true");
    setShowMessage((prev) => !prev);
  };

  if (loading) return <Loading />;

  return (
    <main>
      <div className="px-32 py-14 dark:text-primary-200 h-screen flex flex-col">
        <Header />
        <div className="flex flex-col md:flex-row w-full flex-1 p-md-0 p-4 overflow-hidden max-h-[600px] mt-auto">
          <div className="w-1/3 flex flex-col max-h-[480px] md:order-1">
            <CreateSection />
          </div>
          <div className="flex flex-col justify-start items-start w-2/3 order-md-0 max-w-[73%] relative">
            <Transition show={showMessage}>
              <div className="flex gap-2">
                <h2 className="text-6xl font-bold">Welcome to Click Battle!</h2>
                <FontAwesomeIcon
                  icon={faClose}
                  className="cursor-pointer"
                  size="lg"
                  onClick={handleCloseMessage}
                />
              </div>
              <p className="text-3xl w-2/3 mt-4">
                Compete in real time against other players, test your speed and
                accuracy, and climb the leaderboard - click faster than anyone
                else and prove you&apos;re the best!
              </p>
              <p className="text-3xl font-bold my-3">
                Are you up for the challenge?
              </p>
            </Transition>
            <h3 className="text-4xl font-bold mb-8">{t("Available rooms")}</h3>
            {listGames.length > 0 ? (
              <div className="games-container grid grid-cols-1 md:grid-cols-2 gap-6 p-2 overflow-y-auto">
                {listGames.map((game, i) => (
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
                ))}
              </div>
            ) : (
              gameUser?.username && <CardGameAd />
            )}
          </div>
        </div>
        <Footer />
      </div>
      <LoginModal />
    </main>
  );
};

export default Home;
