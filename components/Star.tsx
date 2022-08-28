import { faStar, faStarHalfAlt } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarEmpty } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { MouseEvent, useEffect, useState } from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

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
  useHalves,
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
    if (Math.ceil(hoverPosition) < position) {
      setIcon(faStarEmpty as IconProp);
    } else if (Math.ceil(hoverPosition) === position && useHalves) {
      if (overHalf) {
        setIcon(faStar);
      } else {
        setIcon(faStarHalfAlt);
      }
      onHover(overHalf ? position : position - 0.5);
    } else {
      setIcon(faStar);
    }
  }, [overHalf, hoverPosition]);

  return (
    <>
      {rating.isSelected && rating.value >= position - 0.5 ? (
        <FontAwesomeIcon
          className="star-rate"
          icon={rating.value === position - 0.5 ? faStarHalfAlt : faStar}
          size="lg"
          color="goldenrod"
          onMouseEnter={() => (!rating.isSelected ? onHover(position) : null)}
          onMouseMove={(e) =>
            Math.ceil(hoverPosition) === position && useHalves
              ? handleCoords(e)
              : null
          }
          onMouseLeave={() => onHover(0)}
          onClick={() => onSelected(overHalf ? position : position - 0.5)}
        />
      ) : null}
      {(!rating.isSelected || rating.value <= position - 1) && (
        <FontAwesomeIcon
          className="star-rate"
          icon={icon}
          size="lg"
          onMouseEnter={() => onHover(position)}
          onMouseMove={(e) =>
            Math.ceil(hoverPosition) === position && useHalves
              ? handleCoords(e)
              : null
          }
          onMouseLeave={() => onHover(0)}
          onClick={() => onSelected(overHalf ? position : position - 0.5)}
        />
      )}
    </>
  );
};

export default React.memo(Star);
