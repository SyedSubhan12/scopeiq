# Senior debugging — reference

## Minimal repro template

```markdown
## Environment
- App / service:
- Version / commit:
- OS / runtime:

## Steps
1.
2.
3.

## Expected
## Actual
## Logs / screenshots
```

## Post-incident summary (lightweight)

- **Impact**: duration, users/tenants, error rate delta.
- **Detection**: how we noticed (alert, user, deploy pipeline).
- **Root cause**: one paragraph, technical.
- **Mitigation**: what stopped/stemmed impact.
- **Fix**: permanent code/config change + PR link.
- **Prevention**: tests, monitors, runbooks, guardrails.

## Useful questions under ambiguity

- Does it reproduce on **another machine** or **clean DB**?
- Does it reproduce with **one user** vs **all**?
- Is the failing path **cached** (CDN, browser, Redis)?
- Did **deploy order** matter (API before web, migration before code)?
- Is the bug **stateful** (only after prior action)?

## Observability quick map

- **Frontend**: network tab (status, response body), console, source maps.
- **API**: structured logs with **request id**, handler timing, downstream status.
- **DB**: slow query log, `EXPLAIN`, row counts, lock waits.
- **Queues**: failed job payload, retry count, poison message handling.
