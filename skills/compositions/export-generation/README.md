# export-generation

This composition packages canonical ACP export generation into one operator workflow.

It combines:

- `research-cli-operator`
- `operator-audit`

## Workflow

1. Resolve target cycle and export mode.
2. Generate requested export mode or all canonical modes.
3. Write one response file per export.
4. Write `export-manifest.json`.

## Command

```sh
bash skills/compositions/export-generation/run.sh <cycle-id> [analysis|audit|minimal|all] [out-dir]
```

With no arguments, the composition runs a local demo intervention cycle and writes all export modes under:

```text
skills/compositions/export-generation/out/demo-export-generation
```

## Outputs

- `export-response-analysis.json`
- `export-response-audit.json`
- `export-response-minimal.json`
- `export-manifest.json`

## Failure handling

Stop on invalid export modes or CLI failures. Preserve the partial output directory for inspection.

## Evaluation hooks

- Run with no arguments for a deterministic local smoke.
- Run `npm run skills:audit` to verify packaging.
