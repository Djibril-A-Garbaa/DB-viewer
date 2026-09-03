# ReLife Data Studio

ReLife Data Studio est un éditeur graphique local permettant de concevoir et de documenter un schéma de base de données. Il fonctionne dans le navigateur et sauvegarde automatiquement le travail sur l’ordinateur.

## Prérequis

- Windows 10 ou Windows 11
- Node.js LTS 20 ou supérieur
- npm, installé automatiquement avec Node.js
- Un navigateur récent : Edge, Chrome ou Firefox

Pour vérifier l’installation :

```powershell
node --version
npm.cmd --version
```

Si Node.js n’est pas installé :

```powershell
winget install OpenJS.NodeJS.LTS
```

Fermez puis rouvrez PowerShell après l’installation.

## Installation du projet

Ouvrez PowerShell dans le dossier du projet :

```powershell
cd "C:\Users\Stagiaire 2\Documents\West ID ReLife\IA"
npm.cmd install
```

La commande `npm.cmd install` télécharge les dépendances déclarées dans `package.json`. Elle n’est nécessaire que lors de la première installation ou après une modification des dépendances.

## Démarrage en développement

```powershell
npm.cmd run dev
```

Vite affiche une adresse similaire à :

```text
http://localhost:5173/
```

Ouvrez cette adresse dans le navigateur. Laissez PowerShell ouvert pendant l’utilisation. Pour arrêter le serveur, revenez dans PowerShell et appuyez sur `Ctrl + C`.

## Utilisation du diagramme

- Glissez le fond pour vous déplacer dans le graphe.
- Utilisez la molette pour défiler.
- Utilisez `Maj + molette` pour un déplacement horizontal.
- Utilisez `Ctrl + molette` ou les boutons `+` et `−` pour zoomer.
- Glissez l’en-tête d’une table pour la déplacer.
- Cliquez sur le nom d’un champ pour le renommer.
- Glissez la poignée d’un champ pour changer son ordre.
- Glissez directement un lien pour régler manuellement son espacement.
- Double-cliquez sur un lien pour restaurer sa position automatique.
- Le déplacement tactile du graphe et des tables est pris en charge.

## Tables, champs et relations

Le panneau de gauche permet de créer, rechercher et réordonner les tables. Le panneau de droite permet de modifier les champs, leurs types et les options suivantes :

- Clé primaire (`PK`)
- Clé étrangère (`FK`)
- Champ nullable
- Table liée
- Multiplicités `1`, `*`, `0..1` et `0..*`
- Types standards, listes et Enums

Les panneaux latéraux peuvent être masqués afin d’agrandir la zone du diagramme.

## Énumérations

La section **Énumérations** du panneau gauche permet de :

- Créer rapidement un Enum
- Renommer un Enum
- Ajouter, renommer et supprimer ses valeurs
- Utiliser l’Enum comme type d’un champ

## Sauvegarde et export

Le schéma est sauvegardé automatiquement dans le stockage local du navigateur. Utilisez régulièrement l’export JSON pour conserver une copie transportable.

- **Importer JSON** : charge un schéma précédemment exporté.
- **Exporter JSON** : sauvegarde toute la structure, les positions, Enums et relations.
- **Exporter SQL** : génère les instructions `CREATE TABLE`.
- **Exporter SVG** : génère une image vectorielle complète du diagramme.
- **Exporter Entity Framework** : crée un dossier ou une archive `ReLifeShared` contenant les entités C#, Enums, relations et le `DbContext`.

## Construire la version de production

```powershell
npm.cmd run build
```

Les fichiers optimisés sont générés dans le dossier `dist`.

Pour tester cette version localement :

```powershell
npm.cmd run preview
```

## Dépannage

### PowerShell bloque `npm.ps1`

Utilisez directement `npm.cmd` :

```powershell
npm.cmd install
npm.cmd run dev
```

### Le port 5173 est déjà utilisé

Vite choisira automatiquement un autre port, par exemple `5174`. Ouvrez exactement l’adresse affichée dans PowerShell.

### L’application ne démarre plus

Réinstallez les dépendances puis relancez le projet :

```powershell
npm.cmd install
npm.cmd run dev
```

### Réinitialiser le schéma

Utilisez le bouton de réinitialisation dans l’explorateur. Cette action remplace les modifications locales par le schéma initial ; exportez d’abord le JSON si vous souhaitez conserver une copie.
