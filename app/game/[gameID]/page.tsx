import type {Metadata} from "next";

import {createRouteMetadata} from "lib/seo/metadata";

import RoomGameClientPage from "./page-client";

export async function generateMetadata(): Promise<Metadata> {
  return createRouteMetadata("gameRoom");
}

export default function RoomGame() {
  return <RoomGameClientPage />;
}
