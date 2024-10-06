"use client";
import React, {useEffect, useState} from "react";
import {motion} from "framer-motion";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBan} from "@fortawesome/free-solid-svg-icons";
import {IconProp} from "@fortawesome/fontawesome-svg-core";

// Utils
import {timeout} from "utils/timeout";
import clsx from "clsx";

const PointerAnimation = () => {
  const [clicked, setClicked] = useState(false);
  const [position, setPosition] = useState({
    x: 30,
    y: 30
  });

  const MINUTE_MS = 1500;

  useEffect(() => {
    const interval = setInterval(() => {
      pointerAnimation();
    }, MINUTE_MS);
    return () => clearInterval(interval);
  }, []);

  const pointerAnimation = async () => {
    setPosition(getRandomPosition());
    await timeout(500);
    setClicked(true);
    await timeout(200);
    setClicked(false);
    await timeout(1000);
  };

  const getRandomPosition = () => {
    if (typeof window !== "undefined") {
      return {
        x: Math.floor(Math.random() * (window.innerWidth - 100)),
        y: Math.floor(Math.random() * (window.innerHeight - 140))
      };
    } else {
      return {
        x: 30,
        y: 30
      };
    }
  };

  return (
    <div className="h-dvh w-dvw absolute top-0 -z-10 overflow-hidden">
      <motion.div
        animate={{x: position.x, y: position.y}}
        transition={{duration: 0.4}}
      >
        <img
          alt="pointer"
          src={"/img-pointer.png"}
          width={100}
          height={140}
          className={clsx("select-none opacity-100 transition dark:invert", {
            "scale-75": clicked
          })}
        />
        <div className="icon-container relative right-1 -top-40 -z-10">
          <FontAwesomeIcon
            icon={faBan as IconProp}
            height={600}
            size="5x"
            className={clsx("opacity-0 transition dark:invert", {
              "opacity-50": clicked
            })}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default PointerAnimation;
