export const formatDate = (date: Date, locale: string | string[]) => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  };

  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

export const minutesBetween = (startDate: Date, endDate: Date): number => {
  const delta = endDate.getTime() - startDate.getTime();
  return Math.round(delta / 1000 / 60);
};
