# Development

[← Documentation](../../README.md#documentation) · [Français](../fr/development.md)

## Repository layout

```
custom_components/fan_bridge/   The integration
  www/fan-bridge-card.js        The card's bundle, built from src/ (not committed)
src/                            The card's sources (TypeScript, Lit)
test/                           The card's tests (Vitest)
tests/                          The integration's tests (pytest)
docs/                           This documentation (en/, fr/, images/)
.devcontainer/                  A Home Assistant to try it in
```

## Integration

Python 3.14, Home Assistant 2026.2 or newer.

Build the card first (`npm ci && npm run build`): a test checks the bundle the integration serves.

```bash
pip install -r requirements_test.txt
pytest
ruff check custom_components tests
```

Tests run against a real Home Assistant (`pytest-homeassistant-custom-component`) for the entities and the config and options flows, and against mocks for the remotes' MQTT subscription.

## Card

```bash
npm ci
npm run typecheck   # tsc on sources and tests
npm run lint        # ESLint
npm test            # Vitest (jsdom)
npm run build       # writes custom_components/fan_bridge/www/fan-bridge-card.js
```

The bundle is **not committed**: every pull request touching the card would conflict on it. The release workflow builds it and ships it in the release zip. `npm run watch` also writes a sourcemap for local debugging; it is git-ignored and never published.

The version lives in `package.json`, `src/version.ts` and `custom_components/fan_bridge/manifest.json`; a test fails when they disagree.

## Devcontainer

Build the card on your host first (`npm install && npm run build`), then **Dev Containers: Reopen in Container** in VS Code: a Home Assistant starts on http://localhost:8123 with the bundle available. See [.devcontainer/README.md](../../.devcontainer/README.md).

## Continuous integration

- **Build**: typecheck, lint, tests, build
- **Integration**: build of the card, pytest, ruff
- **Validate**: hassfest and HACS. Translation strings must not contain anything that looks like HTML (`<name>`), hassfest rejects it.

## Releases

1. Set the version in `package.json`, `src/version.ts` and `custom_components/fan_bridge/manifest.json`, and add a `## <version>` section to `CHANGELOG.md`.
2. Push a tag named after the version (`1.1.0` or `v1.1.0`).

The **Release** workflow checks the versions, builds the card, zips `custom_components/fan_bridge/` (bundle included) into `fan_bridge.zip` and publishes the GitHub release with the CHANGELOG section as notes. HACS installs that zip (`zip_release` in `hacs.json`), and does not offer the default branch, which has no bundle.

## Documentation

The documentation exists in English (`docs/en/`) and French (`docs/fr/`), with the same pages; change both. Screenshots are in `docs/images/card/` and `docs/images/options/`, once per language, taken from a Home Assistant whose user profile is set to that language.
