import {useState, useEffect} from "react";

const useIsMobileDevice = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let hasTouchScreen = false;

    if (navigator.maxTouchPoints) {
      hasTouchScreen = navigator.maxTouchPoints > 0;
    } else {
      const mQ = window.matchMedia("(pointer:coarse)");
      if (mQ && mQ.media === "(pointer:coarse)") {
        hasTouchScreen = !!mQ.matches;
      } else if ("orientation" in window) {
        hasTouchScreen = true; // deprecated, but good fallback
      } else {
        // Only as a last resort, fall back to user agent sniffing
        const UA = navigator.userAgent;
        console.log({UA});
        hasTouchScreen =
          /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
          /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
      }
    }

    setIsMobile(hasTouchScreen);

    // Clean up the event listener (if needed)
    return () => {
      // Add cleanup logic here if necessary
    };
  }, []);

  return isMobile;
};

export default useIsMobileDevice;
