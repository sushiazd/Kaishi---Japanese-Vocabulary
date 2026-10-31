# Kaishi 1.5k FR + Kanji N5 — PWA iPhone (style Anki)

App web mono-fichier, hébergée sur GitHub Pages, installée sur l'écran d'accueil iPhone. Interface en français.

## Build
- Sources dans `source/`. Lancer `python3 source/build.py` : assemble `source/src/*` + les données JSON dans `index.html` (racine, c'est ce que sert Pages). Ne jamais éditer `index.html` à la main.
- Ordre de concaténation du JS : `app_head.js` → `views.js` → `kanji.js` → `app_tail.js`.
- À CHAQUE release : incrémenter `VERSION` dans `sw.js` (ex. `kaishi-v10`), sinon l'iPhone garde l'ancien cache.
- Déploiement : push sur `main` (Pages sert la racine).

## Architecture
- `source/src/app_head.js` : constantes, état, planificateur SM-2 façon Anki (pas 1/10 min, réapprentissage 10 min, graduation 1 j, facile 4 j, ease 2500, min 1300, fuzz ; q : 0 nouveau, 1 apprentissage, 2 révision, 3 réapprentissage), file d'étude, stockage.
- `source/src/views.js` : accueil, onglets de deck, cartes d'étude, feuilles, réglages, stats, grille/détail, méthode.
- `source/src/kanji.js` : conversion romaji→kana, vérification des réponses (normalisation FR + Levenshtein), leçons par lots de 5 (Sens/Lecture/Écriture + quiz tapé), révisions tapées, vérificateur de tracé (rééchantillonnage 24 points, tolérance, sens, ordre), test de niveau.
- `source/src/app_tail.js` : clavier, démarrage.
- Données : `source/data/kaishi-data.json` (1500 cartes : mot, lecture, sens FR, furigana, phrase, traduction, note, accent, grammaire, POS) ; `source/data/kanji-data.json` (79 kanji : sens, on/kun, composants, mnémo, tracés KanjiVG, exemples, sens acceptés, astuce de lecture). Générés par `source/kanji-tools/` (kanji_raw.json + kanji_fr.py + kanji_extra.py).

## Stockage (important)
- localStorage clé `kaishi-fr-v1`, stockage par blocs de 100 (`CHUNK`). Ids : vocab 0..1499, lecture kanji `10000+i`, écriture kanji `20000+i`.
- Sur iPhone, Safari et l'app d'écran d'accueil ont des stockages séparés ; supprimer l'icône efface les données. Sauvegarde/restauration JSON dans Réglages. Ne pas casser le format de sauvegarde.

## Licences des données
KanjiVG (CC BY-SA 3.0), kanji-data/KANJIDIC (MIT), liste JLPT N5 (Waller), deck Kaishi 1.5k.

## Pistes non faites
Cartes radicaux (D), avertissement kanji similaires (F), lien kanji→vocab prioritaire (G), pas du jour 1 plus serrés (H), sauvegarde automatique quotidienne.
