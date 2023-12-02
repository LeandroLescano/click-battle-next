import React from "react";
import {useRouter} from "next/dist/client/router";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";

const PointerAnimation = dynamic(
  () => import("../components/pointerAnimation")
);

const NotFound = () => {
  const router = useRouter();
  return (
    <Layout>
      <>
        <main className="container c-404">
          <h1 className="fs-1">404</h1>
          <h1>{"Ouch, we can't find what you're looking for"}</h1>
          <h4 className="mt-2">We can offer you to go back to home :)</h4>
          <button
            className="btn-click p-2 btn-back mt-4"
            onClick={() => router.push("/")}
          >
            Back to home
          </button>
        </main>
        <PointerAnimation />
      </>
    </Layout>
  );
};

export default NotFound;
