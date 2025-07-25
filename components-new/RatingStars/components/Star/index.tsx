import React, {MouseEvent, useEffect, useState} from "react";

import {Full} from "icons/Hearts/Full";
import {Half} from "icons/Hearts/Half";
import {Empty} from "icons/Hearts/Empty";

interface Props {
  position: number;
  hoverPosition: number;
  rating: {
    value: number;
    isSelected: boolean;
  };
  onHover: (val: number) => void;
  onSelected: (val: number) => void;
  useHalves: boolean;
}

const Star = ({
  position,
  hoverPosition,
  rating,
  onHover,
  onSelected,
  useHalves
}: Props) => {
  const [overHalf, setOverHalf] = useState(false);
  const [IconComponent, setIconComponent] = useState(() => Empty);

  const handleCoords = (e: MouseEvent<HTMLDivElement>) => {
    const currentTarget = e.currentTarget.getBoundingClientRect();
    if (currentTarget.width / 2 < e.clientX - currentTarget.left) {
      setOverHalf(true);
    } else {
      setOverHalf(false);
    }
  };

  useEffect(() => {
    if (Math.ceil(hoverPosition) === position && hoverPosition > 0) {
      onHover(overHalf ? position : position - 0.5);
    }
    let positionToUse = hoverPosition;
    if (
      rating.isSelected &&
      (Math.ceil(rating.value) >= position || rating.value === position - 0.5)
    ) {
      positionToUse = rating.value;
    }

    if (Math.ceil(positionToUse) > position) {
      setIconComponent(() => Full);
    } else if (
      (Math.ceil(positionToUse) === position || rating.value === position) &&
      useHalves
    ) {
      if (
        (hoverPosition > 0 && overHalf) ||
        Math.floor(rating.value) === position
      ) {
        setIconComponent(() => Full);
      } else {
        setIconComponent(() => Half);
      }
    } else {
      setIconComponent(() => Empty);
    }
  }, [overHalf, hoverPosition, rating.value]);

  return (
    <div
      className="md:min-w-16 transition-all duration-200 md:hover:scale-110"
      style={{color: rating.isSelected ? "var(--color-primary-400)" : "white"}}
      onMouseEnter={() => onHover(position)}
      onMouseMove={(e) =>
        Math.ceil(
          rating.isSelected && hoverPosition === 0
            ? rating.value
            : hoverPosition
        ) === position && useHalves
          ? handleCoords(e)
          : null
      }
      onMouseLeave={() => onHover(0)}
      onClick={() => onSelected(overHalf ? position : position - 0.5)}
    >
      <IconComponent
        color={rating.isSelected ? "var(--color-primary-400)" : "white"}
      />
    </div>
  );
};

export default React.memo(Star);
