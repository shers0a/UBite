import React from 'react';

/* Lucide 0.x outline set, copied into assets/icons/ and inlined here so a glyph inherits
   currentColor and needs no network request. 24x24 grid, 2px stroke, round caps.
   UBite uses no other icon system and no emoji. */
export const GLYPHS = {
  "arrow-right": "<path d=\"M5 12h14\"></path> <path d=\"m12 5 7 7-7 7\"></path>",
  "ban": "<path d=\"M4.929 4.929 19.07 19.071\"></path> <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>",
  "bell": "<path d=\"M10.268 21a2 2 0 0 0 3.464 0\"></path> <path d=\"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\"></path>",
  "calendar": "<path d=\"M8 2v3\"></path> <path d=\"M16 2v3\"></path> <rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"></rect> <path d=\"M3 9h18\"></path>",
  "camera": "<path d=\"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z\"></path> <circle cx=\"12\" cy=\"13\" r=\"3\"></circle>",
  "chart-column": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\"></path> <path d=\"M18 17V9\"></path> <path d=\"M13 17V5\"></path> <path d=\"M8 17v-3\"></path>",
  "check": "<path d=\"M20 6 9 17l-5-5\"></path>",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\"></path>",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\"></path>",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\"></path>",
  "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\"></line> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\"></line>",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"m16 9-5.5 5.5L8 12\"></path>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"M12 6v6l4 2\"></path>",
  "cookie": "<path d=\"M11 17h.01\"></path> <path d=\"M11.496 2c.324-.016.558.292.529.615a4 4 0 004.235 4.368.713.713 0 01.758.757 4 4 0 004.366 4.237c.323-.03.63.204.614.527a10 10 0 01-2.915 6.566A1 1 0 114.93 4.918 10 10 0 0111.496 2\"></path> <path d=\"M12 12h.01\"></path> <path d=\"M16 16h.01\"></path> <path d=\"M16 3h.01\"></path> <path d=\"M21 4h.01\"></path> <path d=\"M21 8h.01\"></path> <path d=\"M7 14h.01\"></path> <path d=\"M9 8h.01\"></path>",
  "cup-soda": "<path d=\"m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8\"></path> <path d=\"M5 8h14\"></path> <path d=\"M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0\"></path> <path d=\"m12 8 1-6h2\"></path>",
  "download": "<path d=\"M12 15V3\"></path> <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path> <path d=\"m7 10 5 5 5-5\"></path>",
  "egg": "<path d=\"M12 2C8 2 4 8 4 14a8 8 0 0 0 16 0c0-6-4-12-8-12\"></path>",
  "face-neutral": "<path d=\"M15 10V9\"></path> <path d=\"M8 16h8\"></path> <path d=\"M9 10V9\"></path> <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>",
  "face-slightly-frowning": "<path d=\"M15 10V9\"></path> <path d=\"M9 10V9\"></path> <path d=\"M9 16a5 5 0 016 0\"></path> <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>",
  "face-slightly-smiling": "<path d=\"M15 10V9\"></path> <path d=\"M16.472 15a6 6 0 01-8.943 0\"></path> <path d=\"M9 10V9\"></path> <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>",
  "fish": "<path d=\"M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z\"></path> <path d=\"M18 12v.5\"></path> <path d=\"M16 17.93a9.77 9.77 0 0 1 0-11.86\"></path> <path d=\"M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33\"></path> <path d=\"M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4\"></path> <path d=\"m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98\"></path>",
  "gift": "<rect x=\"3\" y=\"8\" width=\"18\" height=\"4\" rx=\"1\"></rect> <path d=\"M12 8v13\"></path> <path d=\"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7\"></path> <path d=\"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5\"></path>",
  "heart": "<path d=\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5\"></path>",
  "image-plus": "<path d=\"M16 5h6\"></path> <path d=\"M19 2v6\"></path> <path d=\"M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5\"></path> <path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\"></path> <circle cx=\"9\" cy=\"9\" r=\"2\"></circle>",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"M12 16v-4\"></path> <path d=\"M12 8h.01\"></path>",
  "languages": "<path d=\"m5 8 6 6\"></path> <path d=\"m4 14 6-6 2-3\"></path> <path d=\"M2 5h12\"></path> <path d=\"M7 2h1\"></path> <path d=\"m22 22-5-10-5 10\"></path> <path d=\"M14 18h6\"></path>",
  "leaf": "<path d=\"M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20\"></path> <path d=\"M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13\"></path>",
  "loader-circle": "<path d=\"M21 12a9 9 0 1 1-6.219-8.56\"></path>",
  "log-in": "<path d=\"m10 17 5-5-5-5\"></path> <path d=\"M15 12H3\"></path> <path d=\"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4\"></path>",
  "log-out": "<path d=\"m16 17 5-5-5-5\"></path> <path d=\"M21 12H9\"></path> <path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"></path>",
  "mail": "<path d=\"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7\"></path> <rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"></rect>",
  "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"></path> <circle cx=\"12\" cy=\"10\" r=\"3\"></circle>",
  "megaphone": "<path d=\"M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z\"></path> <path d=\"M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14\"></path> <path d=\"M8 6v8\"></path>",
  "milk": "<path d=\"M8 2h8\"></path> <path d=\"M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2\"></path> <path d=\"M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0\"></path>",
  "milk-off": "<path d=\"M8 2h8\"></path> <path d=\"M9 2v1.343M15 2v2.789a4 4 0 0 0 .672 2.219l.656.984a4 4 0 0 1 .672 2.22v1.131M7.8 7.8l-.128.192A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3\"></path> <path d=\"M7 15a6.47 6.47 0 0 1 5 0 6.472 6.472 0 0 0 3.435.435\"></path> <line x1=\"2\" x2=\"22\" y1=\"2\" y2=\"22\"></line>",
  "minus": "<path d=\"M5 12h14\"></path>",
  "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"></path> <path d=\"m15 5 4 4\"></path>",
  "plus": "<path d=\"M5 12h14\"></path> <path d=\"M12 5v14\"></path>",
  "qr-code": "<rect width=\"5\" height=\"5\" x=\"3\" y=\"3\" rx=\"1\"></rect> <rect width=\"5\" height=\"5\" x=\"16\" y=\"3\" rx=\"1\"></rect> <rect width=\"5\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\"></rect> <path d=\"M21 16h-3a2 2 0 0 0-2 2v3\"></path> <path d=\"M21 21v.01\"></path> <path d=\"M12 7v3a2 2 0 0 1-2 2H7\"></path> <path d=\"M3 12h.01\"></path> <path d=\"M12 3h.01\"></path> <path d=\"M12 16v.01\"></path> <path d=\"M16 12h1\"></path> <path d=\"M21 12v.01\"></path> <path d=\"M12 21v-1\"></path>",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"></path> <path d=\"M21 3v5h-5\"></path> <path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"></path> <path d=\"M8 16H3v5\"></path>",
  "salad": "<path d=\"M7 21h10\"></path> <path d=\"M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z\"></path> <path d=\"M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1\"></path> <path d=\"m13 12 4-4\"></path> <path d=\"M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2\"></path>",
  "scan-line": "<path d=\"M3 7V5a2 2 0 0 1 2-2h2\"></path> <path d=\"M17 3h2a2 2 0 0 1 2 2v2\"></path> <path d=\"M21 17v2a2 2 0 0 1-2 2h-2\"></path> <path d=\"M7 21H5a2 2 0 0 1-2-2v-2\"></path> <path d=\"M7 12h10\"></path>",
  "search": "<path d=\"m21 21-4.34-4.34\"></path> <circle cx=\"11\" cy=\"11\" r=\"8\"></circle>",
  "settings": "<path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\"></path> <circle cx=\"12\" cy=\"12\" r=\"3\"></circle>",
  "share": "<path d=\"M12 2v13\"></path> <path d=\"m16 6-4-4-4 4\"></path> <path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\"></path>",
  "sliders-horizontal": "<path d=\"M10 5H3\"></path> <path d=\"M12 19H3\"></path> <path d=\"M14 3v4\"></path> <path d=\"M16 17v4\"></path> <path d=\"M21 12h-9\"></path> <path d=\"M21 19h-5\"></path> <path d=\"M21 5h-7\"></path> <path d=\"M8 10v4\"></path> <path d=\"M8 12H3\"></path>",
  "soup": "<path d=\"M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z\"></path> <path d=\"M7 21h10\"></path> <path d=\"M19.5 12 22 6\"></path> <path d=\"M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62\"></path> <path d=\"M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62\"></path> <path d=\"M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62\"></path>",
  "sprout": "<path d=\"M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3\"></path> <path d=\"M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4\"></path> <path d=\"M5 21h14\"></path>",
  "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\"></path>",
  "trash": "<path d=\"M10 11v6\"></path> <path d=\"M14 11v6\"></path> <path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"></path> <path d=\"M3 6h18\"></path> <path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path>",
  "trending-up": "<path d=\"M16 7h6v6\"></path> <path d=\"m22 7-8.5 8.5-5-5L2 17\"></path>",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"></path> <path d=\"M12 9v4\"></path> <path d=\"M12 17h.01\"></path>",
  "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\"></path> <circle cx=\"12\" cy=\"7\" r=\"4\"></circle>",
  "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"></path> <path d=\"M16 3.128a4 4 0 0 1 0 7.744\"></path> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"></path> <circle cx=\"9\" cy=\"7\" r=\"4\"></circle>",
  "utensils": "<path d=\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\"></path> <path d=\"M7 2v20\"></path> <path d=\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\"></path>",
  "wheat": "<path d=\"M2 22 16 8\"></path> <path d=\"M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"></path> <path d=\"M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"></path> <path d=\"M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"></path> <path d=\"M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z\"></path> <path d=\"M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"></path> <path d=\"M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"></path> <path d=\"M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"></path>",
  "wheat-off": "<path d=\"m2 22 10-10\"></path> <path d=\"m16 8-1.17 1.17\"></path> <path d=\"M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"></path> <path d=\"m8 8-.53.53a3.5 3.5 0 0 0 0 4.94L9 15l1.53-1.53c.55-.55.88-1.25.98-1.97\"></path> <path d=\"M10.91 5.26c.15-.26.34-.51.56-.73L13 3l1.53 1.53a3.5 3.5 0 0 1 .28 4.62\"></path> <path d=\"M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z\"></path> <path d=\"M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"></path> <path d=\"m16 16-.53.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.49 3.49 0 0 1 1.97-.98\"></path> <path d=\"M18.74 13.09c.26-.15.51-.34.73-.56L21 11l-1.53-1.53a3.5 3.5 0 0 0-4.62-.28\"></path> <line x1=\"2\" x2=\"22\" y1=\"2\" y2=\"22\"></line>",
  "wifi-off": "<path d=\"M12 20h.01\"></path> <path d=\"M8.5 16.429a5 5 0 0 1 7 0\"></path> <path d=\"M5 12.859a10 10 0 0 1 5.17-2.69\"></path> <path d=\"M19 12.859a10 10 0 0 0-2.007-1.523\"></path> <path d=\"M2 8.82a15 15 0 0 1 4.177-2.643\"></path> <path d=\"M22 8.82a15 15 0 0 0-11.288-3.764\"></path> <path d=\"m2 2 20 20\"></path>",
  "x": "<path d=\"M18 6 6 18\"></path> <path d=\"m6 6 12 12\"></path>"
};

export function Icon({ name, size = 20, stroke = 2, label, style, ...rest }) {
  const d = GLYPHS[name];
  if (!d) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      focusable="false"
      style={{ display: 'block', flex: 'none', ...style }}
      dangerouslySetInnerHTML={{ __html: d }}
      {...rest}
    />
  );
}
