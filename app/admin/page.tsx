import type {Metadata} from "next";

import {createRouteMetadata} from "lib/seo/metadata";

import AdminClientPage from "./page-client";

export async function generateMetadata(): Promise<Metadata> {
  return createRouteMetadata("admin");
}

export default function Admin() {
  return <AdminClientPage />;
}
