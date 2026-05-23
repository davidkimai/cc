console.log(JSON.stringify({
  skill: 'public-hearing-triage',
  commands: [
    'npm run benchmark:compare -- --class public-hearing-triage',
    'npm run benchmark:ablation -- --class public-hearing-triage',
    'npm run benchmark:scale'
  ]
}, null, 2));

