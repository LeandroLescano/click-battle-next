import {Game} from "interfaces";

export const gamesMock: Game[] = [
  {
    key: null,
    listUsers: [],
    status: "lobby",
    ownerUser: {username: "host"},
    roomName: "Waiting Room",
    created: new Date(),
    settings: {
      maxUsers: 10,
      timer: 300
    }
  },
  {
    key: "fastGame",
    listUsers: [{clicks: 0, rol: "owner", username: "alone", key: "user789"}],
    status: "playing",
    ownerUser: {username: "alone"},
    roomName: "Solo Challenge",
    created: new Date(),
    settings: {
      maxUsers: 1,
      timer: 10
    }
  },
  {
    key: "passwordProtected",
    listUsers: [],
    status: "lobby",
    ownerUser: {username: "puzzler"},
    roomName: "Brain Teaser",
    created: new Date("2024-02-15"), // February 15, 2024
    settings: {
      maxUsers: 2,
      timer: 120,
      password: "thinkfast"
    }
  },
  {
    key: "finishedGame",
    listUsers: [
      {clicks: 200, rol: "owner", username: "champion", key: "user001"},
      {clicks: 150, rol: "visitor", username: "challenger", key: "user002"}
    ],
    status: "lobby",
    ownerUser: {username: "champion"},
    roomName: "Epic Duel",
    created: new Date("2024-03-09"), // March 9, 2024
    settings: {
      timer: 0,
      maxUsers: 2
    }
  },
  {
    key: "game123",
    listUsers: [
      {clicks: 10, rol: "owner", username: "player1", key: "user123"},
      {clicks: 5, rol: "visitor", username: "player2", key: "user456"}
    ],
    status: "playing",
    ownerUser: {username: "admin"},
    roomName: "My Awesome Game",
    created: new Date(2024, 2, 10), // March 10, 2024
    settings: {
      maxUsers: 4,
      timer: 60,
      password: "secret"
    }
  }
];
