# Entités et services

[← Documentation](../../README.fr.md#documentation) · [English](../en/reference.md)

Les identifiants d'entités ne dépendent pas de la langue de Home Assistant. Ils sont attribués à la création d'une entité, d'après le nom donné au ventilateur (`Salon` → `salon`) ; un identifiant que vous avez renommé est conservé.

Chaque ventilateur est un **appareil**, avec une entité par rôle. Un rôle laissé vide dans les options n'a pas d'entité.

| Entité | Existe quand |
| --- | --- |
| `fan.<nom>` | Toujours |
| `light.<nom>_light` | Une lumière est réglée |
| `select.<nom>_timer` | Une minuterie est réglée |
| `switch.<nom>_sound` | Un interrupteur de bip est réglé |

## `fan.<nom>`

Le ventilateur en service, voir [Principal et secours](fans.md).

- **Fonctions :** tout ce que sait faire le ventilateur en service (vitesse, sens, préréglages, oscillation, marche/arrêt).
- **Vitesse :** les pas sont réguliers quel que soit le ventilateur en service, voir [Pourcentages des vitesses](fans.md#pourcentages-des-vitesses).
- **Attributs :** `source_entity`, l'entité en service, et `using_backup`, `true` quand c'est celle de secours.

## `light.<nom>_light`

La lumière en service : allumage, luminosité et température de couleur quand elle les gère. Mêmes attributs.

## `select.<nom>_timer`

La minuterie d'arrêt du ventilateur en service. Pour une entité `number`, les options sont **arrêt, 15 min, 30 min, 1 h, 2 h, 4 h et 8 h** (une valeur hors de celles-ci s'affiche telle quelle, par exemple `45 min`) ; pour une entité `select`, ce sont ses propres options. Mêmes attributs.

## `switch.<nom>_sound`

L'interrupteur du bip en service. Mêmes attributs.

## Boutons de télécommande

Les boutons de télécommande ne sont pas des entités : ils sont stockés dans les options et listés dans **Configurer → Télécommandes**, voir [Télécommandes](remotes.md). Chaque bouton appuyé appelle les services des entités fusionnées (`fan.toggle`, `fan.increase_speed`, `fan.set_percentage`, `fan.set_direction`, `fan.oscillate`, `fan.set_preset_mode`, `light.toggle`, `switch.toggle`, ...).

## Le fichier de la carte

L'intégration sert la carte à l'adresse `/fan_bridge/fan-bridge-card.js?v=<version>-<empreinte>` et la charge dans tous les tableaux de bord. La valeur de `?v=` est la version de l'intégration suivie des 8 premiers caractères du SHA-256 du fichier : le navigateur récupère donc le nouveau fichier dès que l'un des deux change, et **il n'y a pas de cache à vider après une mise à jour**, seulement la page à recharger.
