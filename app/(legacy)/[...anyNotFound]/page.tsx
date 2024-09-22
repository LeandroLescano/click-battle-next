import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const PointerAnimation = dynamic(
  () => import("../../../components/pointerAnimation")
);

const NotFound = () => {
  return (
    <>
      <main className="container c-404">
        <h1 className="fs-1">404</h1>
        <h1>{"Ouch, we can't find what you're looking for"}</h1>
        <h4 className="mt-2">We can offer you to go back to home :)</h4>
        <Link href={"/"} passHref>
          <button className="btn-click p-2 btn-back mt-4">Back to home</button>
        </Link>
      </main>
      <PointerAnimation />
    </>
  );
};

export default NotFound;
