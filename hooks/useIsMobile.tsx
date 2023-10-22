import {useEffect, useState} from "react";

const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);
  const isSSR = typeof window === "undefined";

  useEffect(() => {
    if (isSSR) return;
    let mounted = true;
    if (window && mounted) {
      window.addEventListener("resize", () => {
        if (window.innerWidth > 992) {
          setIsMobile(false);
        } else {
          setIsMobile(true);
        }
      });

      window.addEventListener("load", () => {
        if (window.innerWidth > 992) {
          setIsMobile(false);
        } else {
          setIsMobile(true);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  return isMobile;
};

export default useIsMobile;
