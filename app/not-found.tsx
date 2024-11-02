"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import {Button} from "components-new";

const PointerAnimation = dynamic(
  () => import("../components-new/PointerAnimation")
);

const NotFound = () => {
  return (
    <>
      <main className="overflow-hidden text-center text-3xl md:text-4xl px-10 text-balance">
        <div className="h-dvh flex flex-col items-center justify-center gap-4">
          <h1 className="text-9xl font-bold text-primary-400 dark:text-primary-200">
            404
          </h1>
          <h1 className="text-primary-400 dark:text-primary-200">
            {"Ouch, we can't find what you're looking for"}
          </h1>
          <h4 className="mt-2 text-primary-400 dark:text-primary-200">
            We can offer you to go back to home :)
          </h4>
          <Link href={"/"} passHref>
            <Button className="p-2 mt-4 text-xl">Back to home</Button>
          </Link>
        </div>
      </main>
      <PointerAnimation />
    </>
  );
};

export default NotFound;
