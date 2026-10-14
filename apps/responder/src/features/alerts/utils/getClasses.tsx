import type { ReactElement } from "react";
import type { NotificationType } from "../../../types/alert";
import {
  Ban,
  CircleAlert,
  Megaphone,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";

// Badge text colors don't cascade to children on RN the way CSS color does on
// the web, so the icon gets an explicit hex (iconColor) and badgeTextColor is
// kept separate from badgeColor. Icon hues use the same "-600" tones as the
// card's left border so both light/dark themes stay readable.
const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: LucideIcon;
    iconColor: string;
    badgeColor: string;
    badgeTextColor: string;
    containerBorderColor: string;
  }
> = {
  critical: {
    icon: TriangleAlert,
    iconColor: "#dc2626", // red-600
    badgeColor:
      "bg-red-100 border-red-400 dark:bg-red-950/50 dark:border-red-700",
    badgeTextColor: "text-red-800 dark:text-red-300",
    containerBorderColor: "border-red-600",
  },
  warning: {
    icon: CircleAlert,
    iconColor: "#ca8a04", // yellow-600
    badgeColor:
      "bg-yellow-100 border-yellow-400 dark:bg-yellow-950/50 dark:border-yellow-700",
    badgeTextColor: "text-yellow-800 dark:text-yellow-300",
    containerBorderColor: "border-yellow-600",
  },
  blockage: {
    icon: Ban,
    iconColor: "#4b5563", // gray-600
    badgeColor:
      "bg-gray-100 border-gray-400 dark:bg-slate-700 dark:border-slate-500",
    badgeTextColor: "text-gray-800 dark:text-gray-300",
    containerBorderColor: "border-gray-600",
  },
  announcement: {
    icon: Megaphone,
    iconColor: "#2563eb", // blue-600
    badgeColor:
      "bg-blue-100 border-blue-400 dark:bg-blue-950/50 dark:border-blue-700",
    badgeTextColor: "text-blue-800 dark:text-blue-300",
    containerBorderColor: "border-blue-600",
  },
  maintenance: {
    icon: Wrench,
    iconColor: "#d97706", // amber-600
    badgeColor:
      "bg-amber-100 border-amber-400 dark:bg-amber-950/50 dark:border-amber-700",
    badgeTextColor: "text-amber-800 dark:text-amber-300",
    containerBorderColor: "border-amber-600",
  },
};

const cfg = (type: NotificationType) =>
  TYPE_CONFIG[type] ?? TYPE_CONFIG.warning;

export const getIcon = (type: NotificationType): ReactElement | null => {
  const { icon: Icon, iconColor } = cfg(type);
  return <Icon size={16} color={iconColor} />;
};

export const getBadgeColor = (type: NotificationType): string =>
  cfg(type).badgeColor;

export const getBadgeTextColor = (type: NotificationType): string =>
  cfg(type).badgeTextColor;

export const getContainerBorderColor = (type: NotificationType): string =>
  cfg(type).containerBorderColor;
