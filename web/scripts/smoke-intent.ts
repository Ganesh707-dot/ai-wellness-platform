import { resolveSpecialtyIntent } from "../lib/specialty-intent";
import { resolveCarePath } from "../lib/care-path";
import { topIntent } from "../lib/intent-search";

const cases = [
  "health is not well for mother after child birth",
  "my toddler has a mild fever",
  "seasonal sneezing and itchy eyes",
];

for (const c of cases) {
  const si = resolveSpecialtyIntent(c);
  const cp = resolveCarePath(c);
  const ti = topIntent(c);
  console.log("---", c);
  console.log("specialty:", si.specialty, si.confidence.toFixed(2));
  console.log("carePath:", cp.specialty, cp.concernLabel);
  console.log("topIntent:", ti?.label, ti?.specialty);
}
