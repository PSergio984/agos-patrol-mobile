/**
 * Returns the most recent date from an array of ISO 8601 date strings
 * (e.g. "2026-02-21T15:38:19.145253Z")
 */
export const getMostRecentDate = (dates: string[]): string => {
  if (dates.length === 0) return "";
  return dates.reduce((latest, current) =>
    new Date(current) > new Date(latest) ? current : latest
  );
};

export const getTimeAgo = (timestamp: string): string => {
  if (!timestamp) return "No data";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Invalid date";
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
};

export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatDate = (dateString: string, locale: string = "en-US") => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTimestamp = (
  timestampString: string,
  locale: string = "en-US"
) => {
  if (!timestampString) return "N/A";
  const date = new Date(timestampString);
  if (isNaN(date.getTime())) return "N/A";

  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatPHNumber = (phoneNumber: string): string => {
  // This regex looks for the +63 prefix, then captures 3 digits, 3 digits, and 4 digits
  return phoneNumber.replace(/(\+63)(\d{3})(\d{3})(\d{4})/, "$1 $2 $3 $4");
};
