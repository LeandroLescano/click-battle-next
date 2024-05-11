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
    <section
      className="d-flex justify-content-center align-items-center overflow-y-hidden px-4"
      style={{height: "95vh"}}
    >
      <div className="h-100 w-100" ref={loadingContainer} />
    </section>
  );
};
