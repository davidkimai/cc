import { readFile } from 'node:fs/promises';

const canonical = ['draft', 'scheduled', 'submission_open', 'submission_closed', 'routing_complete', 'digests_released', 'reflection_closed', 'archived', 'failed'];
const input = process.argv[2];
let status = 'submission_closed';
if (input) {
  const cycle = JSON.parse(await readFile(input, 'utf8'));
  status = cycle.status;
}
const index = canonical.indexOf(status);
console.log(JSON.stringify({
  status,
  canonical: index >= 0,
  nextStatus: index >= 0 && index < canonical.length - 2 ? canonical[index + 1] : null,
}, null, 2));

