/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";
import React, {Fragment, useEffect, useState} from "react";
import Swal from "sweetalert2";
import {useTranslation} from "react-i18next";
import {getAnalytics, logEvent} from "firebase/analytics";
import {useRouter, useSearchParams} from "next/navigation";
import {child, getDatabase, onValue, ref, set} from "@firebase/database";
import dynamic from "next/dynamic";
import {Toast, ToastContainer} from "react-bootstrap";

import {Game, GameUser} from "interfaces";
import {
  CardGame,
  Footer,
  requestPassword,
  ModalCreateUsername,
  CardGameAd,
  Loading
} from "components";
import CreateSection from "components/CreateSection/CreateSection";
import {ModalLoginProps} from "components/ModalLogin/types";
import {useAuth} from "contexts/AuthContext";
import {useGame} from "contexts/GameContext";

const ModalLogin = dynamic<ModalLoginProps>(
  () =>
    import("../../components/ModalLogin").then(
      (component) => component.ModalLogin
    ),
  {
    ssr: false
  }
);

const Home = () => {
  const [listGames, setListGames] = useState<Game[]>([]);
  const [showNewStyleToast, setShowNewStyleToast] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const db = getDatabase();
  const {gameUser, user, loading} = useAuth();
  const {resetGame, setGame} = useGame();
  const {t} = useTranslation();

  useEffect(() => {
    //If exist userKey get user from DB
    if (params.get("kickedOut") === "true") {
      router.replace("/legacy");
      //TODO: Add a global Swal mixin with heightAuto:false
      Swal.fire({
        title: t("You were kicked out by the owner"),
        icon: "error",
        confirmButtonText: "Ok",
        heightAuto: false
      });
    } else if (params.get("fullRoom") === "true") {
      router.replace("/legacy");
      Swal.fire({
        title: t("Room is full"),
        icon: "error",
        confirmButtonText: "Ok",
        heightAuto: false
      });
    } else if (params.get("suspicionOfHack") === "true") {
      router.replace("/legacy");
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

    if (!localStorage.getItem("newStyle")) {
      setShowNewStyleToast(true);
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
        router.push(`game/${game.key}`);
      } else {
        console.error("Error loading user to game");
      }
    }
  };

  const handleOnConfirmStyling = () => {
    logEvent(getAnalytics(), "confirm_styling");
    localStorage.setItem("newStyle", "true");
    setShowNewStyleToast(false);
    router.push("/");
  };

  const handleOnCancelStyling = () => {
    logEvent(getAnalytics(), "cancel_styling");
    localStorage.setItem("newStyle", "false");
    setShowNewStyleToast(false);
  };

  if (loading) return <Loading />;

  return (
    <>
      <ToastContainer position="top-center" className="mt-2">
        <Toast show={showNewStyleToast} animation>
          <Toast.Body className="d-flex gap-2 align-items-center py-3 bg-white rounded">
            <>
              <span className="text-dark">
                {t("Check out our fresh new look!")}
              </span>
              <button
                className="btn-click small"
                onClick={handleOnConfirmStyling}
              >
                {t("Try it now")}
              </button>
              <button
                className="btn btn-close"
                onClick={handleOnCancelStyling}
              />
            </>
          </Toast.Body>
        </Toast>
      </ToastContainer>
      <div className="main h-100 d-flex overflow-y-auto">
        <div className="d-flex flex-md-row flex-column w-100 flex-fill p-md-0 p-4">
          <div className="col-lg-4 order-md-1 create-section">
            <CreateSection />
          </div>
          <div className="col-lg-8 order-md-0 rooms-section">
            <h2>{t("Available rooms")}</h2>
            {listGames.length > 0 ? (
              <div
                className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 mh-100 align-content-start"
                style={{minHeight: "90%"}}
              >
                {listGames.map((game, i) => (
                  <Fragment key={i}>
                    <CardGame
                      game={game}
                      roomNumber={i}
                      handleEnterGame={() => handleEnterGame(game)}
                    />
                    {(listGames.length === 1 ||
                      (i !== 0 &&
                        (i % 5 === 0 || i === listGames.length - 1))) && (
                      <CardGameAd />
                    )}
                  </Fragment>
                ))}
              </div>
            ) : (
              gameUser?.username && (
                <div
                  className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 mh-100 align-content-start"
                  style={{minHeight: "90%"}}
                >
                  <CardGameAd />
                </div>
              )
            )}
          </div>
        </div>
        <Footer />
      </div>
      <ModalLogin />
      <ModalCreateUsername />
    </>
  );
};

export default Home;
