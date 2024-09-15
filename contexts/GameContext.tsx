"use client";

import React, {useState, useContext, createContext, useEffect} from "react";
import {useTranslation} from "react-i18next";

import {Game, GameUser} from "interfaces";
import {getSuffixPosition} from "utils/string";

interface GameContextState {
  game: Game;
  setGame: (game: Partial<Game>) => void;
  localPosition?: string;
  resetGame: VoidFunction;
  localUser: GameUser;
  setLocalUser: (user: GameUser) => void;
  isHost: boolean;
  setIsHost: (isHost: boolean) => void;
  calculatePosition: VoidFunction;
}

const initialGame = {
  currentGame: false,
  gameStart: false,
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
  timer: 10,
  timeStart: 3,
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
  setGame: () => {},
  resetGame: () => {},
  setLocalUser: () => {},
  setIsHost: () => {},
  calculatePosition: () => {}
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
  const [localUser, setLocalUser] = useState<GameUser>({
    username: "",
    clicks: 0
  });
  const [isHost, setIsHost] = useState(false);

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
      }
    }
  };

  const setPartialGame = (partialGame: Partial<Game>) => {
    setGame((prev) => ({...prev, ...partialGame}));
  };

  const resetGame = () => {
    setGame(initialGame);
  };

  return {
    game,
    localPosition,
    localUser,
    isHost,
    setGame: setPartialGame,
    setLocalUser,
    resetGame,
    setIsHost,
    calculatePosition
  };
}
