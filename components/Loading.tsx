import React, {useEffect, useRef} from "react";
import loadingAnim from "../lotties/loading.json";
import Lottie from "lottie-web";

const Loading = () => {
  const loadingContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loadingContainer?.current?.innerHTML === "") {
      Lottie.loadAnimation({
        container: loadingContainer.current!,
        animationData: loadingAnim
      });
    }
  }, []);

  return (
    <section
      className="d-flex justify-content-center align-items-center overflow-y-hidden"
      style={{height: "95vh"}}
    >
      <div className="w-25" ref={loadingContainer} />
    </section>
  );
};

export default Loading;
