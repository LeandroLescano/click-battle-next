import {faStar, faStarHalfAlt} from "@fortawesome/free-solid-svg-icons";
import {faStar as faStarEmpty} from "@fortawesome/free-regular-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React, {MouseEvent, useEffect, useState} from "react";
import {IconProp} from "@fortawesome/fontawesome-svg-core";

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
  const [icon, setIcon] = useState<IconProp>(faStarEmpty as IconProp);

  const handleCoords = (e: MouseEvent<SVGElement, globalThis.MouseEvent>) => {
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
      setIcon(faStar as IconProp);
    } else if (
      (Math.ceil(positionToUse) === position || rating.value === position) &&
      useHalves
    ) {
      if (
        (hoverPosition > 0 && overHalf) ||
        Math.floor(rating.value) === position
      ) {
        setIcon(faStar as IconProp);
      } else {
        setIcon(faStarHalfAlt as IconProp);
      }
    } else {
      setIcon(faStarEmpty as IconProp);
    }
  }, [overHalf, hoverPosition, rating.value]);

  return (
    <>
      <FontAwesomeIcon
        className="md:min-w-16 transition-all duration-200 md:hover:scale-110 size-9 md:size-16"
        icon={icon}
        color={rating.isSelected ? "var(--color-primary-400)" : "default"}
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
      />
    </>
  );
};

export default React.memo(Star);
