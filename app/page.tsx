"use client";

// React
import React, {useEffect, useState} from "react";

// Interfaces
import {Game, GameUser} from "interfaces";

// Router
import {useRouter, useSearchParams} from "next/navigation";

// Next
import dynamic from "next/dynamic";

// Firebase
import {child, getDatabase, onValue, ref, set} from "@firebase/database";
import {getAnalytics, logEvent} from "firebase/analytics";

// Components
import {
  CardGame,
  Footer,
  requestPassword,
  ModalCreateUsername
} from "components";
import CreateSection from "components/CreateSection/CreateSection";
import Loading from "components/Loading";

// Utils
import Swal from "sweetalert2";

// Hooks
import {useAuth} from "contexts/AuthContext";

const ModalLogin = dynamic(() => import("../components/ModalLogin"), {
  ssr: false
});

const Home = () => {
  const [listGames, setListGames] = useState<Game[]>([]);
  const router = useRouter();
  const params = useSearchParams();
  const db = getDatabase();
  const {gameUser, user, loading} = useAuth();

  useEffect(() => {
    //If exist userKey get user from DB
    if (params.get("kickedOut") === "true") {
      router.replace("/");
      Swal.fire({
        title: "You were kicked out by the owner.",
        icon: "error",
        confirmButtonText: "Ok"
      });
    } else if (params.get("fullRoom") === "true") {
      router.replace("/");
      Swal.fire({
        title: "The room is full.",
        icon: "error",
        confirmButtonText: "Ok"
      });
    } else if (params.get("suspicionOfHack") === "true") {
      router.replace("/");
      Swal.fire({
        title: "Fair play is important to us",
        text: "Please refrain from using unauthorized tools or hacks while playing.",
        icon: "warning",
        confirmButtonText: "Ok"
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    //Get rooms of games from DB
    if (gameUser?.username) {
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
        if (Object.keys(game.listUsers).length === game.maxUsers) {
          Swal.fire({
            icon: "warning",
            title: "Room is full",
            toast: true,
            showConfirmButton: false,
            position: "bottom-end",
            timer: 3000
          });
        } else {
          if (game.password) {
            requestPassword(game.password).then((val) => {
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
        title: "Ups! We couldn't enter the room, please try again.",
        timer: 3000,
        timerProgressBar: true
      });
    }
  };

  //Function for add actualGameID to sessionStorage and add new user to game in database
  const configRoomToEnter = (game: Game) => {
    if (game.key && game.ownerUser) {
      sessionStorage.setItem("actualIDGame", game.key);
      sessionStorage.setItem("actualOwner", game.ownerUser.username);
      if (gameUser && game.ownerUser.username !== gameUser.username) {
        if (user?.uid) {
          const userToPush: GameUser = {
            username: gameUser.username,
            clicks: 0,
            rol: "visitor"
          };
          if (gameUser.maxScore) {
            userToPush["maxScore"] = gameUser.maxScore;
          }
          const refGame = ref(db, `games/${game.key}/listUsers`);
          const childRef = child(refGame, user.uid);
          set(childRef, userToPush);
          logEvent(getAnalytics(), "enter_room", {
            action: "enter_room",
            withCustomName: !!game.roomName,
            withPassword: !!game.password,
            maxUsers: game.maxUsers,
            isRegistered: !user.isAnonymous
          });
          router.push(`game/${game.key}`);
        } else {
          console.error("Error loading user to game");
        }
      }
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="main h-100 d-flex overflow-y-auto">
        <div className="d-flex flex-md-row flex-column w-100 flex-fill p-md-0 p-4">
          <div className="col-lg-4 order-md-1 create-section">
            <CreateSection />
          </div>
          <div className="col-lg-8 order-md-0 rooms-section">
            <h2>Available rooms</h2>
            {listGames.length > 0 ? (
              <div
                className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 mh-100 align-content-start"
                style={{minHeight: "90%"}}
              >
                {listGames.map((game, i) => (
                  <CardGame
                    game={game}
                    key={i}
                    roomNumber={i}
                    handleEnterGame={() => handleEnterGame(game)}
                  />
                ))}
              </div>
            ) : (
              <h4 className="h-100">
                No available rooms right now, create one!
              </h4>
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
