"use client";

import React, {useEffect, useRef} from "react";

import logoAnim from "lotties/logo-animated.json";

export const Loading = () => {
  const loadingContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let animation: {destroy: () => void} | undefined;

    void import("lottie-web").then(({default: Lottie}) => {
      if (disposed || loadingContainer.current?.innerHTML !== "") {
        return;
      }

      animation = Lottie.loadAnimation({
        container: loadingContainer.current,
        animationData: logoAnim,
        loop: true,
        autoplay: true,
        renderer: "svg"
      });
    });

    return () => {
      disposed = true;
      animation?.destroy();
    };
  }, []);

  return (
    <section
      className="d-flex justify-content-center align-items-center overflow-y-hidden px-4"
      style={{height: "95vh"}}
    >
      <div className="h-100 w-100" ref={loadingContainer} />
    </section>
  );
};
