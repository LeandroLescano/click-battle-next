import {useEffect, useState} from "react";

interface UserInfo {
  userAgent: string;
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  ipAddress?: string;
}

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        // Get User Agent
        const userAgent = navigator.userAgent;

        // Get Browser Details
        const browser = (function () {
          const ua = navigator.userAgent;
          const isFirefox = /Firefox/i.test(ua);
          const isChrome = /Chrome/i.test(ua);
          const isSafari = /Safari/i.test(ua);
          const isEdge = /Edg/i.test(ua);

          if (isFirefox) return "Firefox";
          if (isChrome) return "Chrome";
          if (isSafari) return "Safari";
          if (isEdge) return "Edge";

          return "Unknown";
        })();

        // Get Operating System
        const os = (function () {
          const platform = navigator.platform;
          const isWindows = /Win/i.test(platform);
          const isMac = /Mac/i.test(platform);
          const isLinux = /Linux/i.test(platform);

          if (isWindows) return "Windows";
          if (isMac) return "Mac OS";
          if (isLinux) return "Linux";

          return "Unknown";
        })();

        // Get Screen Resolution
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;

        // Get IP Address (Note: This is just an example, and it might not work in all cases)
        let ipAddress: string | undefined;
        try {
          const response = await fetch("https://api64.ipify.org?format=json");
          const data = await response.json();
          ipAddress = data.ip;
        } catch (error) {
          console.error("Error fetching IP Address:", error);
        }

        // Log User Info
        const userInfo: UserInfo = {
          userAgent,
          browser,
          os,
          screenWidth,
          screenHeight,
          ipAddress
        };

        setUserInfo(userInfo);
      } catch (error) {
        console.error("Error fetching user information:", error);
      }
    };

    getUserInfo();
  }, []);

  return userInfo;
};
