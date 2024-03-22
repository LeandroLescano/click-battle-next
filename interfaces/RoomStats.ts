export interface RoomStats {
  id?: string;
  name: string;
  created: Date;
  removed: Date;
  maxUsersConnected: number;
  owner: string;
  gamesPlayed: GamePlayed[];
  withPassword: boolean;
}

interface GamePlayed {
  numberOfUsers: number;
  maxClicks: number;
  timer: number;
}
