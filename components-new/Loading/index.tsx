"use client";

import React, {useEffect, useRef} from "react";
import logoAnim from "lotties/logo-animated.json";

export const Loading = () => {
  const loadingContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let animation: {destroy: () => void} | undefined;

    void import("lottie-web").then(({default: Lottie}) => {
      if (
        disposed ||
        !loadingContainer.current ||
        loadingContainer.current.innerHTML !== ""
      ) {
        return;
      }

      animation = Lottie.loadAnimation({
        container: loadingContainer.current,
        animationData: logoAnim,
        loop: true,
        autoplay: true,
        renderer: "svg"
      });

      if (disposed) {
        animation.destroy();
      }
    });

    return () => {
      disposed = true;
      animation?.destroy();
    };
  }, []);

  return (
    <main>
      <section className="flex justify-center items-center overflow-y-hidden h-dvh">
        <div className="h-1/3 w-1/3" ref={loadingContainer} />
      </section>
    </main>
  );
};
