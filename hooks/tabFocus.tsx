import {useState, useEffect} from "react";

export const useTabFocus = () => {
  const [isFocused, setIsFocused] = useState(true);

  const handleVisibilityChange = () => {
    setIsFocused(!document.hidden);
  };

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isFocused;
};
