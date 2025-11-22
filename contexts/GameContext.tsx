"use client";

import {Game, GameUser} from "@leandrolescano/click-battle-core";
import React, {useState, useContext, createContext, useEffect} from "react";
import {useTranslation} from "react-i18next";

import {FinalResults} from "interfaces";
import {getSuffixPosition} from "utils/string";
interface GameContextState {
  game: Game;
  setGame: (game: Partial<Game>) => void;
  localPosition?: string;
  resetGame: VoidFunction;
  localUser: GameUser;
  setLocalUser: (user: GameUser) => void;
  isHost: boolean;
  hasEnteredPassword?: boolean;
  finalResults?: FinalResults;
  setIsHost: (isHost: boolean) => void;
  calculatePosition: VoidFunction;
  resetContext: VoidFunction;
  setHasEnteredPassword: (hasEnteredPassword: boolean) => void;
}

const initialGame: Game = {
  status: "lobby",
  listUsers: [],
  ownerUser: {
    username: ""
  },
  roomName: "",
  settings: {
    maxUsers: 2,
    password: "",
    timer: 10
  },
  key: ""
};

const GameContext = createContext<GameContextState>({
  game: initialGame,
  isHost: false,
  localPosition: undefined,
  localUser: {
    username: "",
    clicks: 0
  },
  finalResults: undefined,
  setGame: () => {},
  resetGame: () => {},
  setLocalUser: () => {},
  setIsHost: () => {},
  calculatePosition: () => {},
  resetContext: () => {},
  setHasEnteredPassword: () => {}
});

interface Props {
  children: JSX.Element;
}

export function GameProvider({children}: Props) {
  const game = useGameProvider();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  return useContext(GameContext);
};

function useGameProvider(): GameContextState {
  const [game, setGame] = useState<Game>(initialGame);
  const [localPosition, setLocalPosition] = useState<string>();
  const [finalResults, setFinalResults] = useState<FinalResults>();
  const [localUser, setLocalUser] = useState<GameUser>({
    username: "",
    clicks: 0
  });
  const [isHost, setIsHost] = useState(false);
  const [hasEnteredPassword, setHasEnteredPassword] = useState(false);

  const {t} = useTranslation();

  useEffect(() => {
    const storedGame = sessionStorage.getItem("game");
    if (storedGame) {
      setGame(JSON.parse(storedGame));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("game", JSON.stringify(game));
  }, [game]);

  const calculatePosition = () => {
    for (const i in game.listUsers) {
      if (game.listUsers[i].username === localUser.username) {
        const position = Number(i) + 1;
        setLocalPosition(getSuffixPosition(position, t));
        setFinalResults({
          localPosition: getSuffixPosition(position, t),
          results: game.listUsers
        });
      }
    }
  };

  const setPartialGame = (partialGame: Partial<Game>) => {
    setGame((prev) => ({...prev, ...partialGame}));
  };

  const resetGame = () => {
    setGame(initialGame);
  };

  const resetContext = () => {
    setGame(initialGame);
    setLocalPosition(undefined);
    setFinalResults(undefined);
    setLocalUser({username: "", clicks: 0});
    setIsHost(false);
  };

  return {
    game,
    localPosition,
    localUser,
    isHost,
    hasEnteredPassword,
    finalResults,
    setHasEnteredPassword,
    setGame: setPartialGame,
    setLocalUser,
    resetGame,
    setIsHost,
    calculatePosition,
    resetContext
  };
}
