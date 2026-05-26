export interface RoomStats {
  id?: string;
  name: string;
  created: Date;
  removed: Date;
  maxUsersConnected: number;
  owner: string;
  gamesPlayed: GamePlayed[];
  withPassword: boolean;
  gameMode?: string;
}

interface GamePlayed {
  numberOfUsers: number;
  maxClicks: number;
  timer: number;
  gameMode?: string;
}
