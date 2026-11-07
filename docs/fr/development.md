# Développement

[← Documentation](../../README.fr.md#documentation) · [English](../en/development.md)

## Organisation du dépôt

```
custom_components/fan_bridge/   L'intégration
  www/fan-bridge-card.js        Le fichier de la carte, construit depuis src/ (versionné)
src/                            Les sources de la carte (TypeScript, Lit)
test/                           Les tests de la carte (Vitest)
tests/                          Les tests de l'intégration (pytest)
dist/fan-bridge-card.js         Le même fichier, pour les installations manuelles (versionné)
docs/                           Cette documentation (en/, fr/, images/)
.devcontainer/                  Un Home Assistant pour essayer
```

## Intégration

Python 3.14, Home Assistant 2026.2 ou plus récent.

```bash
pip install -r requirements_test.txt
pytest
ruff check custom_components tests
```

Les tests tournent sur un vrai Home Assistant (`pytest-homeassistant-custom-component`) pour les entités et les assistants de configuration et d'options, et sur des simulations pour l'abonnement MQTT des télécommandes.

## Carte

```bash
npm ci
npm run typecheck   # tsc sur les sources et les tests
npm run lint        # ESLint
npm test            # Vitest (jsdom)
npm run build       # écrit dist/ et custom_components/fan_bridge/www/
```

Versionnez **les deux** fichiers reconstruits avec les sources : la CI échoue s'ils diffèrent d'une construction neuve. `npm run watch` écrit aussi une sourcemap pour le débogage local ; elle est ignorée par git et jamais publiée.

La version est dans `package.json`, `src/version.ts` et `custom_components/fan_bridge/manifest.json` ; un test échoue si elles divergent.

## Devcontainer

Construisez d'abord la carte sur votre machine (`npm install && npm run build`), puis **Dev Containers : Reopen in Container** dans VS Code : un Home Assistant démarre sur http://localhost:8123 avec le fichier de la carte disponible. Voir [.devcontainer/README.md](../../.devcontainer/README.md).

## Intégration continue

- **Build** : typecheck, lint, tests, construction, fichiers à jour
- **Intégration** : pytest, ruff
- **Validate** : hassfest et HACS. Les textes de traduction ne doivent rien contenir qui ressemble à du HTML (`<nom>`), hassfest le refuse.

## Documentation

La documentation existe en anglais (`docs/en/`) et en français (`docs/fr/`), avec les mêmes pages ; modifiez les deux. Les captures sont dans `docs/images/card/` et `docs/images/options/`, une fois par langue, prises sur un Home Assistant dont le profil utilisateur est réglé dans cette langue.
