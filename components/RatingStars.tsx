import React, { useEffect, useState } from "react";
import Star from "./Star";

interface Props {
  showNumberRating?: boolean;
  cant?: number;
  useHalves?: boolean;
  onChange?: (value: number) => void;
  onSelect?: (value: boolean) => void;
  numberStyle?: object;
}

const RatingStars = ({
  showNumberRating = true,
  cant = 5,
  useHalves = true,
  onChange,
  numberStyle = {},
}: Props) => {
  const [hoverPosition, setHoverPosition] = useState(0);
  const [rating, setRating] = useState({
    value: 0,
    isSelected: false,
  });

  useEffect(() => {
    if (onChange) {
      onChange(hoverPosition);
    }
  }, [hoverPosition]);

  return (
    <div className="d-flex justify-content-center flex-column">
      <div>
        <h2 style={{ ...numberStyle }}>
          {rating.isSelected ? rating.value : hoverPosition}
        </h2>
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
