export interface Settings {
  maxUsers: number;
  roomName: string | undefined;
  password?: string | null;
  timer: number;
}

export type SettingsSidebarProps = {
  options: Settings;
  idGame: string;
  showSideBar: boolean;
  handleSideBar: (value: boolean) => void;
};
