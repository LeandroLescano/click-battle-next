import React, { useEffect, useState } from "react";
import { RATING } from "../resources/constants";
import Star from "./Star";

interface Props {
  showNumberRating?: boolean;
  cant?: number;
  useHalves?: boolean;
  onChange?: (value: number) => void;
  onSelect?: (value: number) => void;
  numberStyle?: object;
  initialValue?: number;
}

const RatingStars = ({
  showNumberRating = true,
  cant = 5,
  useHalves = true,
  onChange,
  onSelect,
  numberStyle = {},
  initialValue = 0,
}: Props) => {
  const [hoverPosition, setHoverPosition] = useState(0);
  const [rating, setRating] = useState({
    value: initialValue,
    isSelected: initialValue ? true : false,
  });

  useEffect(() => {
    if (onChange) {
      onChange(hoverPosition);
    }
  }, [hoverPosition]);

  useEffect(() => {
    if (onSelect && rating.isSelected) {
      onSelect(rating.value);
      setHoverPosition(0);
    }
  }, [rating]);

  return (
    <div className="d-flex justify-content-center flex-column">
      <div>
        {showNumberRating ? (
          <h3 style={{ ...numberStyle }}>
            {rating.isSelected ? RATING[rating.value] : RATING[hoverPosition]}
          </h3>
        ) : null}
      </div>
      <div className="stars-container">
        {[...Array(cant)].map((val, i) => {
          return (
            <Star
              key={i}
              position={i + 1}
              rating={rating}
              hoverPosition={hoverPosition}
              onHover={(value) => setHoverPosition(value)}
              onSelected={(value) =>
                setRating({
                  isSelected: true,
                  value: value,
                })
              }
              useHalves={useHalves}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RatingStars;
