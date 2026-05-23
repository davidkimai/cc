# foresight-submission-prep

This S3 composition prepares the Foresight Supercooperation pre-submission packet from ACP evidence.

It combines:

- `public-hearing-triage`
- `conference-foresight-packaging`
- `operator-audit`
- `pilot-analysis`

## Workflow

1. Generate the Foresight package.
2. Confirm required reviewer-facing memos exist.
3. Confirm package summary reports `ok: true`.
4. Write a composition summary.

## Command

```sh
bash skills/compositions/foresight-submission-prep/run.sh [out-dir]
```

## Outputs

- `foresight-package-summary.json`
- `composition-summary.json`
- generated Foresight package directory

## Failure handling

Do not delete failed package output. Report missing memos or failed checks directly.

## Evaluation hooks

- Run `bash skills/compositions/foresight-submission-prep/run.sh /tmp/acp-foresight-skill-smoke`.
- Run `npm run skills:audit`.
