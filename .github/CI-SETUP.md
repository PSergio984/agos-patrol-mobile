# CI setup — apps/responder

CI mirrors the CEIT-Library pipeline's techniques, adapted for Expo/React
Native: hardened jobs (minimal permissions, timeouts, concurrency),
a composite setup action, SonarCloud quality gate, CodeQL analysis,
a vendored SonarQube secrets scan, and CodeRabbit PR review.

## Workflows

| Workflow | What it does | Needs |
| --- | --- | --- |
| `mobile-ci.yml` | `tsc --noEmit` + `eslint` + `prettier --check` via `.github/actions/setup-mobile`; then SonarCloud scan | nothing for lint; SonarCloud setup below |
| `codeql.yml` | GitHub CodeQL on `actions` + `javascript-typescript`, weekly cron | nothing — works on public repos |
| `sonar-secrets.yml` | `sonar analyze secrets .` via vendored CLI installer | `SONARQUBE_TOKEN` + `SONARCLOUD_ENABLED` |
| `.coderabbit.yaml` | AI PR review with per-path instructions (not a workflow — CodeRabbit app config) | CodeRabbit GitHub App installed |

## Lint/typecheck job

Needs **no secrets or setup** — works as soon as the workflow is on a branch.
Deps install via the `setup-mobile` composite action (`npm ci`, falling back
to `npm install --legacy-peer-deps` if the lockfile is ever absent — the flag
is required: Expo declares a peerOptional `react-dom` npm resolves badly).

## Enabling SonarCloud

Both Sonar jobs are gated behind `SONARCLOUD_ENABLED` so CI stays green until
the project exists. To turn it on:

1. **Create the SonarCloud project** — on sonarcloud.io, under the
   `psergio984` organization, choose "Analyze new project" and import
   `PSergio984/agos-patrol-mobile`. SonarCloud generates a project key
   (expected: `PSergio984_agos-patrol-mobile`). If it differs, update
   `sonar.projectKey` in `sonar-project.properties` (repo root).
2. **Token** — reuse the same token CEIT-Library uses, or generate a new one:
   SonarCloud → My Account → Security → Generate Tokens.
3. **Add the repo secret** — GitHub repo → Settings → Secrets and variables →
   Actions → New repository secret: `SONARQUBE_TOKEN` = the token.
   (Named `SONARQUBE_TOKEN` — identical to CEIT-Library's, so one token works
   for both repos.)
4. **Enable** — same page, Variables tab → `SONARCLOUD_ENABLED` = `true`.

That single setup lights up both the quality-gate scan (`mobile-ci.yml`) and
the secrets scan (`sonar-secrets.yml`).

## TODO — future jobs

- **EAS build** — needs `EXPO_TOKEN` secret + `eas.json` build profiles.
- **Test job** — no tests exist yet; add jest job + lcov artifact → SonarCloud
  coverage when they do (mirrors CEIT's `test` → `sonarcloud` artifact chain;
  then uncomment `sonar.javascript.lcov.reportPaths`).
- **depcruise** — dependency-cruiser architecture rules once module boundaries settle.
