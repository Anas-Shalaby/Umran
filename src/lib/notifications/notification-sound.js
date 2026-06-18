const NOTIFICATION_SOUND_SRC = "/mixkit-correct-answer-tone-2870.wav";

let audio = null;
let unlocked = false;

function getAudio() {
  if (typeof window === "undefined") return null;

  if (!audio) {
    audio = new Audio(NOTIFICATION_SOUND_SRC);
    audio.preload = "auto";
  }

  return audio;
}

export function unlockNotificationSound() {
  const element = getAudio();
  if (!element || unlocked) return;

  const previousVolume = element.volume;
  element.volume = 0;

  const playPromise = element.play();
  if (!playPromise) return;

  playPromise
    .then(() => {
      element.pause();
      element.currentTime = 0;
      element.volume = previousVolume;
      unlocked = true;
    })
    .catch(() => {
      element.volume = previousVolume;
    });
}

export function playNotificationSound() {
  const element = getAudio();
  if (!element) return;

  element.currentTime = 0;
  element.volume = 1;

  void element.play().catch(() => {});
}
