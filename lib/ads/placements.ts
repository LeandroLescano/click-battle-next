export type AdPlacement = {
  format: "fixed" | "fluid";
  height: number;
  id:
    | "classic_local_desktop"
    | "home_rooms_desktop"
    | "home_rooms_mobile"
    | "ranking_bottom_desktop"
    | "ranking_bottom_mobile"
    | "reaction_action_desktop";
  layoutKey?: string;
  minWidth: number;
  slot: string;
  width?: number;
};

export const AD_LABEL = "Advertisements";

export const ADSENSE_PUBLISHER_ID =
  process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ?? "";

export const ADS_ENABLED =
  process.env.NEXT_PUBLIC_ADS_ENABLED !== "false" &&
  ADSENSE_PUBLISHER_ID.length > 0;

export const AD_PLACEMENTS = {
  homeRoomsDesktop: {
    id: "home_rooms_desktop",
    format: "fluid",
    slot: "9606023479",
    layoutKey: "-gv-9+1i-2s+2u",
    minWidth: 250,
    height: 120
  },
  homeRoomsMobile: {
    id: "home_rooms_mobile",
    format: "fixed",
    slot: "4369393021",
    minWidth: 149,
    width: 149,
    height: 63
  },
  classicLocalDesktop: {
    id: "classic_local_desktop",
    format: "fixed",
    slot: "6440984608",
    minWidth: 384,
    width: 384,
    height: 125
  },
  rankingBottomDesktop: {
    id: "ranking_bottom_desktop",
    format: "fluid",
    slot: "9606023479",
    layoutKey: "-gv-9+1i-2s+2u",
    minWidth: 250,
    height: 120
  },
  rankingBottomMobile: {
    id: "ranking_bottom_mobile",
    format: "fixed",
    slot: "4369393021",
    minWidth: 149,
    width: 149,
    height: 63
  },
  reactionActionDesktop: {
    id: "reaction_action_desktop",
    format: "fixed",
    slot: "6440984608",
    minWidth: 384,
    width: 384,
    height: 125
  }
} satisfies Record<string, AdPlacement>;
