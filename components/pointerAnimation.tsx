"use client";
import React, {useEffect, useState} from "react";
import {motion} from "framer-motion";
import Image from "next/image";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBan} from "@fortawesome/free-solid-svg-icons";
import {IconProp} from "@fortawesome/fontawesome-svg-core";

// Utils
import {timeout} from "../utils/timeout";

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
    <div className="container-404">
      <motion.div
        className="container-pointer"
        animate={{x: position.x, y: position.y}}
        transition={{duration: 0.4}}
      >
        <Image
          alt="pointer"
          src={"/img-pointer.png"}
          width={100}
          height={140}
          className={`pointer ${clicked ? "clicked" : ""}`}
        />
        <div className="icon-container">
          <FontAwesomeIcon
            icon={faBan as IconProp}
            height={600}
            size="5x"
            className={`not-found-icon ${clicked ? "clicked" : ""}`}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default PointerAnimation;
