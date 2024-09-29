"use client";

import React, {useEffect, useRef} from "react";
import logoAnim from "lotties/logo-animated.json";
import Lottie from "lottie-web";

export const Loading = () => {
  const loadingContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loadingContainer?.current?.innerHTML === "") {
      Lottie.loadAnimation({
        container: loadingContainer.current!,
        animationData: logoAnim,
        loop: true,
        autoplay: true,
        renderer: "svg"
      });
    }
  }, []);

  return (
    <main>
      <section className="flex justify-center items-center overflow-y-hidden h-screen">
        <div className="h-1/3 w-1/3" ref={loadingContainer} />
      </section>
    </main>
  );
};
