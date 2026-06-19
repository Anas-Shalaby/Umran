export function getCampShareUrl(campId) {
  if (typeof window === "undefined") {
    return `/dashboard/camps/${campId}`;
  }

  return `${window.location.origin}/dashboard/camps/${campId}`;
}

export async function shareCamp({ campId, title }) {
  const url = getCampShareUrl(campId);
  const shareTitle = title ? `معسكر: ${title}` : "معسكر عُمران";
  const shareText = title
    ? `انضم لمعسكر «${title}» على عُمران وساهم في الأثر المشترك.`
    : "انضم لهذا المعسكر على عُمران.";

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url,
      });
      return { ok: true, method: "native" };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { ok: false, cancelled: true };
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return { ok: true, method: "clipboard" };
  }

  throw new Error("share-unavailable");
}
