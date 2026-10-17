import {GameMode} from "@leandrolescano/click-battle-core";

export interface Settings {
  gameMode: Extract<GameMode, "classic-speed" | "reaction">;
  maxUsers: number;
  roomName: string | undefined;
  password?: string | null;
  timer: number;
}

export type SettingsSidebarProps = {
  canChangeGameMode: boolean;
  options: Settings;
  idGame: string;
  showSideBar: boolean;
  handleSideBar: (value: boolean) => void;
};
