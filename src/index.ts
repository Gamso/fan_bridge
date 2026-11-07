import { CARD_VERSION } from "./version";
import "./fan-bridge-card";

// Version banner in the browser console, as HACS cards usually print: tells
// at a glance which build the dashboard actually loaded (cache issues).
console.info(
  `%c FAN-BRIDGE-CARD %c v${CARD_VERSION} `,
  "color: #fff; background: #378add; font-weight: 700;",
  "color: #378add; background: #fff; font-weight: 700;",
);
