import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

import {RATING} from "resources/constants";

import Star from "./components/Star";

interface Props {
  showNumberRating?: boolean;
  cant?: number;
  useHalves?: boolean;
  onChange?: (value: number) => void;
  onSelect?: (value: number) => void;
  numberStyle?: object;
  initialValue?: number;
}

export const RatingStars = ({
  showNumberRating = true,
  cant = 5,
  useHalves = true,
  onChange,
  onSelect,
  numberStyle = {},
  initialValue = 0
}: Props) => {
  const [hoverPosition, setHoverPosition] = useState(0);
  const [rating, setRating] = useState({
    value: initialValue,
    isSelected: initialValue ? true : false
  });
  const {t} = useTranslation();

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
    <div className="flex flex-col justify-center items-center text-center gap-4">
      {showNumberRating ? (
        <div>
          <h3
            className="md:text-3xl font-bold text-primary-700 dark:text-primary-200"
            style={{...numberStyle}}
          >
            {rating.isSelected
              ? t(RATING[rating.value])
              : t(RATING[hoverPosition])}
          </h3>
        </div>
      ) : null}
      <div className="min-h-10 flex gap-5">
        {[...Array(cant)].map((_, i) => {
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
                  value: value
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
