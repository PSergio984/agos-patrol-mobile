import type { ReactElement } from "react";
import type { NotificationType } from "../../../types/alert";
import {
  Ban,
  CircleAlert,
  Megaphone,
  TriangleAlert,
  Wrench,
} from "lucide-react-native";

// Badge text colors don't cascade to children on RN the way CSS color does on
// the web, so the icon gets an explicit hex. Uses the same "-600" hues as the
// card's left border so both light/dark themes stay readable.
export const getIcon = (type: NotificationType): ReactElement | null => {
  const color = getIconColor(type);
  switch (type) {
    case "critical":
      return <TriangleAlert size={16} color={color} />;
    case "warning":
      return <CircleAlert size={16} color={color} />;
    case "blockage":
      return <Ban size={16} color={color} />;
    case "announcement":
      return <Megaphone size={16} color={color} />;
    case "maintenance":
      return <Wrench size={16} color={color} />;
    default:
      return null;
  }
};

const getIconColor = (type: NotificationType): string => {
  switch (type) {
    case "critical":
      return "#dc2626"; // red-600
    case "warning":
      return "#ca8a04"; // yellow-600
    case "blockage":
      return "#4b5563"; // gray-600
    case "announcement":
      return "#2563eb"; // blue-600
    case "maintenance":
      return "#d97706"; // amber-600
    default:
      return "#4b5563";
  }
};

export const getBadgeColor = (type: NotificationType): string => {
  switch (type) {
    case "critical":
      return "bg-red-100 border-red-400 dark:bg-red-950/50 dark:border-red-700";
    case "warning":
      return "bg-yellow-100 border-yellow-400 dark:bg-yellow-950/50 dark:border-yellow-700";
    case "blockage":
      return "bg-gray-100 border-gray-400 dark:bg-slate-700 dark:border-slate-500";
    case "announcement":
      return "bg-blue-100 border-blue-400 dark:bg-blue-950/50 dark:border-blue-700";
    case "maintenance":
      return "bg-amber-100 border-amber-400 dark:bg-amber-950/50 dark:border-amber-700";
    default:
      return "";
  }
};

// Separate from getBadgeColor: on the web `text-*` on the badge div cascades to
// the span; on RN the Text child needs its own color class.
export const getBadgeTextColor = (type: NotificationType): string => {
  switch (type) {
    case "critical":
      return "text-red-800 dark:text-red-300";
    case "warning":
      return "text-yellow-800 dark:text-yellow-300";
    case "blockage":
      return "text-gray-800 dark:text-gray-300";
    case "announcement":
      return "text-blue-800 dark:text-blue-300";
    case "maintenance":
      return "text-amber-800 dark:text-amber-300";
    default:
      return "";
  }
};

export const getContainerBorderColor = (type: NotificationType): string => {
  switch (type) {
    case "critical":
      return "border-red-600";
    case "warning":
      return "border-yellow-600";
    case "blockage":
      return "border-gray-600";
    case "announcement":
      return "border-blue-600";
    case "maintenance":
      return "border-amber-600";
    default:
      return "";
  }
};
