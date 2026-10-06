// One icon system for the whole prototype — inline SVG, no dependency.
// 1.5px stroke on a 24-grid, currentColor, consistent optical size.
//
// Accessibility contract:
//   - Decorative icon beside a text label  → default (aria-hidden).
//   - Icon carrying meaning on its own     → pass `title`; it renders an
//     accessible name. Icon-only *controls* must still label the button.
// Emoji is never used for a control anywhere in the app.

export type IconName =
  | "capture" | "camera" | "cameraFlip" | "torch" | "mic" | "video" | "videoOff"
  | "leave" | "end" | "admit" | "flag" | "photoRequest"
  | "check" | "checkCircle" | "alert" | "warning" | "info" | "clock" | "spinner"
  | "lock" | "unlock" | "link" | "linkOff" | "copy" | "download" | "print"
  | "chevronRight" | "chevronDown" | "chevronLeft" | "arrowRight" | "close" | "menu"
  | "plus" | "search" | "filter" | "pencil" | "star" | "starFilled" | "trash"
  | "grid" | "list" | "calendar" | "clipboard" | "document" | "image" | "images"
  | "user" | "users" | "signOut" | "shield" | "wifi" | "wifiOff" | "refresh"
  | "eye" | "external" | "upload" | "hires" | "note" | "dot" | "minus";

const P: Record<IconName, React.ReactNode> = {
  capture: <><circle cx="12" cy="12" r="8.25" /><circle cx="12" cy="12" r="3.25" fill="currentColor" stroke="none" /></>,
  camera: <><path d="M3 8.5A2 2 0 0 1 5 6.5h1.6l1-1.6h4.8l1 1.6H19a2 2 0 0 1 2 2v8A2 2 0 0 1 19 20H5a2 2 0 0 1-2-2Z" /><circle cx="12" cy="13" r="3.4" /></>,
  cameraFlip: <><path d="M3 8.5A2 2 0 0 1 5 6.5h14a2 2 0 0 1 2 2v8A2 2 0 0 1 19 20H5a2 2 0 0 1-2-2Z" /><path d="M9.5 13.5a2.8 2.8 0 0 1 4.9-1.8M14.5 13a2.8 2.8 0 0 1-4.9 1.8" /><path d="M14.4 9.9v1.8h-1.8M9.6 17.1v-1.8h1.8" /></>,
  torch: <><path d="M9 3h6v3l-1.2 1.8v2.4h-3.6V7.8L9 6Z" /><path d="M10.2 10.2h3.6V21h-3.6Z" /><path d="M12 13.6v2.2" /></>,
  mic: <><rect x="9.2" y="3" width="5.6" height="10" rx="2.8" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" /></>,
  video: <><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 10.5 21 7.5v9L15 13.5Z" /></>,
  videoOff: <><path d="M3 6h9.5v5M12.5 15v3H3a0 0 0 0 1 0 0V6" /><path d="M21 7.5v9l-6-3" /><path d="M3.5 3.5 20.5 20.5" /></>,
  leave: <><path d="M14.5 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h8.5" /><path d="M16.5 8.5 20.5 12l-4 3.5M10 12h10.5" /></>,
  end: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 8.5h7v7h-7Z" fill="currentColor" stroke="none" /></>,
  admit: <><path d="M9.5 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h3.5" /><path d="M13.5 8.5 17 12l-3.5 3.5M7 12h10" /></>,
  flag: <><path d="M5.5 3.5v17" /><path d="M5.5 4.5h11l-1.8 4 1.8 4h-11Z" /></>,
  photoRequest: <><path d="M3.5 8.5a2 2 0 0 1 2-2h1.4l1-1.5h4.6l1 1.5h1.4" /><circle cx="9.5" cy="13" r="3" /><path d="M3.5 10.5v7a2 2 0 0 0 2 2h8" /><path d="M17 12.5v5M19.5 15h-5" /></>,
  check: <path d="m4.5 12.5 4.8 4.8L19.5 7" />,
  checkCircle: <><circle cx="12" cy="12" r="8.5" /><path d="m8 12.3 2.8 2.8L16.2 9.7" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.8v5.4" /><circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none" /></>,
  warning: <><path d="M12 4.2 21 19.8H3Z" /><path d="M12 9.6v4.4" /><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.2" /><circle cx="12" cy="7.9" r="0.9" fill="currentColor" stroke="none" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3.2 2" /></>,
  spinner: <><path d="M12 3.5v3.2" opacity=".95" /><path d="M12 17.3v3.2" opacity=".35" /><path d="M3.5 12h3.2" opacity=".5" /><path d="M17.3 12h3.2" opacity=".8" /><path d="m6.1 6.1 2.3 2.3" opacity=".65" /><path d="m15.6 15.6 2.3 2.3" opacity=".9" /><path d="m17.9 6.1-2.3 2.3" opacity=".85" /><path d="m8.4 15.6-2.3 2.3" opacity=".4" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="9.5" rx="2" /><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" /><path d="M12 14v2.5" /></>,
  unlock: <><rect x="4.5" y="10.5" width="15" height="9.5" rx="2" /><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.3-1.3" /></>,
  link: <><path d="M10 14a3.6 3.6 0 0 1 0-5.1l2.4-2.4a3.6 3.6 0 0 1 5.1 5.1l-1.2 1.2" /><path d="M14 10a3.6 3.6 0 0 1 0 5.1l-2.4 2.4a3.6 3.6 0 0 1-5.1-5.1l1.2-1.2" /></>,
  linkOff: <><path d="M9.6 13.4a3.6 3.6 0 0 1 .3-4.6l1.3-1.3M14.4 10.6a3.6 3.6 0 0 1-.3 4.6l-1.3 1.3" /><path d="M4.5 4.5 19.5 19.5" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15.5 6.5A2 2 0 0 0 13.5 4.5H6a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2" /></>,
  download: <><path d="M12 4v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4.5 19.5h15" /></>,
  print: <><path d="M7 8.5V4h10v4.5" /><rect x="4" y="8.5" width="16" height="7.5" rx="2" /><path d="M7 14h10v6H7Z" /></>,
  chevronRight: <path d="m9.5 5.5 7 6.5-7 6.5" />,
  chevronDown: <path d="M5.5 9.5 12 16l6.5-6.5" />,
  chevronLeft: <path d="m14.5 5.5-7 6.5 7 6.5" />,
  arrowRight: <><path d="M4.5 12h15" /><path d="m14 6.5 5.5 5.5L14 17.5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m15.8 15.8 4 4" /></>,
  filter: <path d="M4 6h16l-6.2 7.2V20l-3.6-2v-4.8Z" />,
  pencil: <><path d="M4.5 19.5h4l11-11a2.2 2.2 0 0 0-3.1-3.1l-11 11Z" /><path d="m14.5 6.5 3.1 3.1" /></>,
  star: <path d="m12 4.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 10.2l5.4-.8Z" />,
  starFilled: <path d="m12 4.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 10.2l5.4-.8Z" fill="currentColor" />,
  trash: <><path d="M5 7.5h14" /><path d="M8.5 7.5V5h7v2.5" /><path d="M6.5 7.5 7.4 20h9.2l.9-12.5" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  list: <path d="M4 6.5h2M9 6.5h11M4 12h2M9 12h11M4 17.5h2M9 17.5h11" />,
  calendar: <><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M3.5 10.5h17M8 3.5v4M16 3.5v4" /></>,
  clipboard: <><rect x="5.5" y="4.5" width="13" height="16" rx="2" /><path d="M9 4.5V3h6v1.5" /><path d="M9 10h6M9 14h4" /></>,
  document: <><path d="M6 3.5h8l4.5 4.5v12.5H6Z" /><path d="M13.5 3.5V8.5H18.5" /><path d="M9 13h6M9 16.5h4" /></>,
  image: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4.5 17.5 4.8-4.4 3.3 3 2.6-2.3 4.3 3.7" /></>,
  images: <><rect x="7" y="3.5" width="13.5" height="11.5" rx="2" /><path d="M17 18.5H5.5a2 2 0 0 1-2-2V7" /><path d="m8.5 12.5 3-2.8 2.3 2 1.9-1.6 3.3 2.9" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.8 20.5a7.2 7.2 0 0 1 14.4 0" /></>,
  users: <><circle cx="9.5" cy="8.5" r="3.4" /><path d="M3.5 20.5a6 6 0 0 1 12 0" /><path d="M16 5.6a3.4 3.4 0 0 1 0 6.4M17.2 15.4a6 6 0 0 1 3.3 5.1" /></>,
  signOut: <><path d="M14.5 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h8.5" /><path d="M17 8.5 20.5 12 17 15.5M10 12h10.5" /></>,
  shield: <><path d="M12 3.5 19.5 6v6.2c0 4.2-3 7-7.5 8.3-4.5-1.3-7.5-4.1-7.5-8.3V6Z" /><path d="m8.8 12.2 2.3 2.3 4.1-4.4" /></>,
  wifi: <><path d="M4 9.2a12 12 0 0 1 16 0" /><path d="M7 12.4a8 8 0 0 1 10 0" /><path d="M9.8 15.6a4 4 0 0 1 4.4 0" /><circle cx="12" cy="18.6" r="1.1" fill="currentColor" stroke="none" /></>,
  wifiOff: <><path d="M4 9.2a12 12 0 0 1 5.4-3" /><path d="M14.6 6.3A12 12 0 0 1 20 9.2" /><path d="M9.8 15.6a4 4 0 0 1 4.4 0" /><circle cx="12" cy="18.6" r="1.1" fill="currentColor" stroke="none" /><path d="M3.8 3.8 20.2 20.2" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20.5 4.5V10h-5.4" /></>,
  eye: <><path d="M2.8 12S6.6 6.5 12 6.5 21.2 12 21.2 12 17.4 17.5 12 17.5 2.8 12 2.8 12Z" /><circle cx="12" cy="12" r="2.9" /></>,
  external: <><path d="M14 4.5h5.5V10" /><path d="M19.5 4.5 11 13" /><path d="M18 14.5v3a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" /></>,
  upload: <><path d="M12 19.5V8.5" /><path d="m7.5 13 4.5-4.5L16.5 13" /><path d="M4.5 20.5h15" /></>,
  hires: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M7.5 15V9m0 3h3.2m0 3V9" /><path d="M14 15V9h1.8a2 2 0 0 1 0 4H14m1.7 0 1.9 2" /></>,
  note: <><path d="M6 3.5h12v17l-6-3-6 3Z" /><path d="M9 8.5h6M9 12h4" /></>,
  dot: <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />,
  minus: <path d="M6 12h12" />,
};

export function Icon({
  name,
  size = 16,
  title,
  className = "",
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  /** Provide when the icon is the only carrier of meaning. */
  title?: string;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {P[name]}
    </svg>
  );
}
