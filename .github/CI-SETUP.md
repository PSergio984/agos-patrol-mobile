# CI setup — apps/responder

`mobile-ci.yml` runs lint/typecheck/format checks on pushes and PRs that touch
`apps/responder/**`, then optionally a SonarCloud scan.

## Lint/typecheck job

Needs **no secrets or setup** — it works as soon as the workflow is on a branch.
It installs deps with `npm ci` (falling back to `npm install` if
`apps/responder/package-lock.json` is ever absent), then runs
`npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`.

## Enabling SonarCloud

The `sonarcloud` job is gated behind the repo variable `SONARCLOUD_ENABLED` so
CI stays green until the project exists. To turn it on:

1. **Create the SonarCloud project** — on sonarcloud.io, under the
   `psergio984` organization, choose "Analyze new project" and import
   `PSergio984/agos-patrol-mobile`. SonarCloud generates a project key
   (expected: `PSergio984_agos-patrol-mobile`). If it differs, update
   `sonar.projectKey` in `sonar-project.properties` (repo root).
2. **Generate a token** — SonarCloud → My Account → Security → Generate Tokens.
3. **Add the repo secret** — GitHub repo → Settings → Secrets and variables →
   Actions → New repository secret: `SONAR_TOKEN` = the token from step 2.
4. **Enable the job** — same page, Variables tab → New repository variable:
   `SONARCLOUD_ENABLED` = `true`.

The scan reads `sonar-project.properties` from the repo root automatically; no
`SONAR_HOST_URL` is needed (the action defaults to sonarcloud.io).

## TODO — future jobs

- **EAS build** — needs `EXPO_TOKEN` secret + `eas.json` build profiles.
- **depcruise** — dependency-cruiser architecture rules once module boundaries settle.
- **Test job** — no tests exist yet; add jest/vitest job + lcov coverage when they do
  (then uncomment `sonar.javascript.lcov.reportPaths`).
