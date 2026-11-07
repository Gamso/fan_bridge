# Development

[← Documentation](../../README.md#documentation) · [Français](../fr/development.md)

## Repository layout

```
custom_components/fan_bridge/   The integration
  www/fan-bridge-card.js        The card's bundle, built from src/ (committed)
src/                            The card's sources (TypeScript, Lit)
test/                           The card's tests (Vitest)
tests/                          The integration's tests (pytest)
dist/fan-bridge-card.js         The same bundle, for manual installs (committed)
docs/                           This documentation (en/, fr/, images/)
.devcontainer/                  A Home Assistant to try it in
```

## Integration

Python 3.14, Home Assistant 2026.2 or newer.

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
npm run build       # writes dist/ and custom_components/fan_bridge/www/
```

Commit **both** rebuilt bundles with the sources: CI fails when they differ from a fresh build. `npm run watch` also writes a sourcemap for local debugging; it is git-ignored and never published.

The version lives in `package.json`, `src/version.ts` and `custom_components/fan_bridge/manifest.json`; a test fails when they disagree.

## Devcontainer

Build the card on your host first (`npm install && npm run build`), then **Dev Containers: Reopen in Container** in VS Code: a Home Assistant starts on http://localhost:8123 with the bundle available. See [.devcontainer/README.md](../../.devcontainer/README.md).

## Continuous integration

- **Build**: typecheck, lint, tests, build, bundles up to date
- **Integration**: pytest, ruff
- **Validate**: hassfest and HACS. Translation strings must not contain anything that looks like HTML (`<name>`), hassfest rejects it.

## Documentation

The documentation exists in English (`docs/en/`) and French (`docs/fr/`), with the same pages; change both. Screenshots are in `docs/images/card/` and `docs/images/options/`, once per language, taken from a Home Assistant whose user profile is set to that language.
