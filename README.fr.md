# FanBridge

[English](README.md) · **Français**

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)

Une intégration Home Assistant pour les ventilateurs de plafond connectés. Elle **fusionne une entité locale et une entité cloud du même ventilateur** (par exemple Tuya Local et Tuya) en un seul jeu d'entités, la locale étant prioritaire et la cloud servant de secours, associe les **boutons d'une télécommande** à des actions, et fournit une **carte de tableau de bord** pour tout commander.

<p align="center">
  <img src="docs/images/card/fr/preview.png" alt="La carte FanBridge" width="420">
</p>

## Fonctionnalités

| | |
| --- | --- |
| 🔁 **Principal et secours** | Pour le ventilateur, la lumière, la minuterie d'arrêt et le bip, une entité principale sert tant qu'elle est disponible et une entité de secours prend le relais sinon, puis lui rend la main dès son retour. → [Principal et secours](docs/fr/fans.md) |
| 🎚️ **Pourcentages des vitesses** | Deux intégrations s'accordent rarement sur les vitesses d'un ventilateur (6 pas contre 100). Donnez le pourcentage de chaque vitesse pour chacune, et le ventilateur fusionné expose des pas réguliers. → [Pourcentages des vitesses](docs/fr/fans.md#pourcentages-des-vitesses) |
| 🎛️ **Télécommandes** | Associez les boutons d'une télécommande Zigbee2MQTT (topic MQTT, capteur d'action ou entité événement) à 15 actions, au lieu d'écrire des automatisations. → [Télécommandes](docs/fr/remotes.md) |
| 🖥️ **Carte de tableau de bord** | Livrée avec l'intégration, rien à installer : cadran des vitesses, sens été/hiver, préréglage, oscillation, lumière, minuterie et bip, avec un badge quand le secours est en service. → [La carte](docs/fr/card.md) |
| ⚙️ **Réglages dans l'interface** | Un assistant d'ajout et une fenêtre d'options, sans YAML. → [Configuration](docs/fr/configuration.md) |

## Prérequis

- **Home Assistant 2026.2** ou plus récent
- Une entité `fan` (deux pour utiliser un secours)
- En option : l'intégration **MQTT** pour les télécommandes lues sur des topics MQTT (Zigbee2MQTT)

La carte demande un navigateur qui gère le `color-mix()` CSS (tous les navigateurs récents et les applications mobiles actuelles).

## Installation

[![Ouvrir votre Home Assistant et ouvrir ce dépôt dans HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Gamso&repository=fan_bridge&category=integration)

Ou à la main :

1. Ouvrez **HACS** dans Home Assistant, puis le menu à trois points → **Dépôts personnalisés**
2. Ajoutez `https://github.com/Gamso/fan_bridge` avec la catégorie **Intégration**
3. Cherchez **FanBridge**, installez-la, puis redémarrez Home Assistant

La carte arrive avec l'intégration : aucune ressource Lovelace à ajouter.

## Premiers pas

[![Ouvrir votre Home Assistant et configurer une nouvelle intégration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=fan_bridge)

Ou :

1. **Paramètres → Appareils et services → Ajouter une intégration → FanBridge**
2. Nommez le ventilateur, choisissez l'entité ventilateur et, en option, un ventilateur de secours
3. Ajoutez la carte **FanBridge** à un tableau de bord (ou `type: custom:fan-bridge-card`, `fan_entity: fan.<nom>`)

Ouvrez ensuite **Configurer** pour ajouter la lumière, la minuterie, le bip, les pourcentages des vitesses et les boutons de télécommande, voir [Configuration](docs/fr/configuration.md).

## Documentation

| Page | Contenu |
| --- | --- |
| [Configuration](docs/fr/configuration.md) | Ajouter un ventilateur, la fenêtre d'options et les entités |
| [Principal et secours](docs/fr/fans.md) | Quelle entité est en service, pourcentages des vitesses, entités fusionnées |
| [Télécommandes](docs/fr/remotes.md) | Associer les boutons d'une télécommande à des actions |
| [La carte](docs/fr/card.md) | Ce que montre la carte, ses options et les entités qu'elle commande |
| [Entités et services](docs/fr/reference.md) | Toutes les entités, attributs et services, le fichier de la carte |
| [Développement](docs/fr/development.md) | Organisation du dépôt, tests, construction de la carte, devcontainer |

## Historique des versions

Voir [CHANGELOG.md](CHANGELOG.md).

## Licence

[MIT](LICENSE)
