import {useState, useEffect} from "react";

export const useIsMobileDevice = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      // Primary pointer is coarse → mobile/tablet UI
      const coarse = window.matchMedia("(pointer: coarse)").matches;

      // Optional safeguard: extremely large screens are almost never mobile
      const smallScreen = window.innerWidth < 1024;

      setIsMobile(coarse && smallScreen);
    };

    check();

    // Update if the user resizes (e.g. rotate a tablet)
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
};
