export const PRAYER_ANCHOR_LABELS = {
  fajr: "بعد الفجر",
  dhuhr: "بين الظهر والعصر",
  asr: "بعد العصر",
  maghrib: "بين المغرب والعشاء",
  isha: "بعد العشاء",
};

export function getCurrentPrayerAnchor(date = new Date()) {
  const hours = date.getHours();

  if (hours >= 4 && hours < 12) return "fajr";
  if (hours >= 12 && hours < 15) return "dhuhr";
  if (hours >= 15 && hours < 18) return "asr";
  if (hours >= 18 && hours < 22) return "maghrib";
  return "isha";
}

export function getLocalTodayDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
