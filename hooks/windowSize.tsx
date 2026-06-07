import {useState, useEffect} from "react";

type WindowSize = {
  width: number;
  height: number;
};

export const useWindowSize = (): WindowSize => {
  const getWindowSize = (): WindowSize => {
    if (typeof window === "undefined") {
      return {
        width: 0,
        height: 0
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  };

  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: getWindowSize().width,
    height: getWindowSize().height
  });

  const handleResize = () => {
    setWindowSize(getWindowSize());
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};
