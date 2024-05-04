import {useEffect, useState} from "react";

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);
  const isSSR = typeof window === "undefined";

  useEffect(() => {
    if (isSSR) return;
    let mounted = true;
    const checkMobile = (window: Window) => {
      if (window.innerWidth > 992) {
        setIsMobile(false);
      } else {
        setIsMobile(true);
      }
    };

    if (window && mounted) {
      checkMobile(window);
      window.addEventListener("resize", () => {
        checkMobile(window);
      });

      window.addEventListener("load", () => {
        checkMobile(window);
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  return isMobile;
};
