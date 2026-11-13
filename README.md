# Portfolio Studio — Jovite Benga

Portfolio Next.js avec galerie cinéma, portraits, pages projets et administration locale.

## Ouvrir le site

Dans ce dossier : `npm run dev`, puis http://127.0.0.1:3000.
Administration : http://127.0.0.1:3000/admin.
Les identifiants privés sont dans `.local/acces-administration.txt` (exclu de Git).

## Modifier les contenus

- **Projets** : Orbite, Sillage et Écho sont trois démonstrations. Leur couverture et leur résumé sont préparés ; contexte, démarche, livrables et galerie restent à remplir. Le champ « Projet de démonstration » permet de garder leur statut explicite.
- **Profil professionnel → Portraits du studio** : choisir les portraits atelier, lumière cinéma, fauteuil et noir et blanc dans la médiathèque.
- **Médiathèque** : importer de nouvelles images et modifier leurs textes alternatifs.
- **Composer l’accueil** : modifier les textes et réorganiser les sections. Enregistrer crée un brouillon.

L’aperçu local montre les brouillons lorsqu’aucune version publiée n’existe. La publication demande une action séparée et la validation des contenus et des droits. Aucun déploiement public n’a été effectué.

## Visuels et animations

Les sept fichiers PNG générés avec l’outil Imagegen intégré sont dans `design/portraits-cinema/`. Les consignes de génération sont dans `PROMPTS.json`. Leurs versions WebP sont enregistrées dans la médiathèque locale. Le portrait cinéma initial reste celui du hero.

Animations : galerie en perspective avec sélection, flèches, clavier et glissement ; fond en fondu ; parallaxe du hero ; boutons magnétiques ; portraits réactifs au pointeur ; bande de projets liée au défilement ; texte révélé au défilement ; cartes superposées du laboratoire ; transitions d’entrée des pages. Les préférences de réduction des mouvements sont respectées.

La typographie utilise Salmond et Great Vibes installées sur cet ordinateur. Pour un hébergement, fournir les fichiers et licences web appropriés.

## Sauvegarde et contrôles

`npm run backup` sauvegarde la base SQLite et les médias dans `.local/backups/`.

`npm run typecheck`, `npm test`, `npm run build`.

Avec le serveur local lancé : `node scripts/integration-check.mjs` vérifie les parcours et l’administration ; `node scripts/cinema-interactions.mjs` vérifie la galerie et les animations. Les scripts de navigateur utilisent Edge installé sur Windows. Les captures sont dans `test-results/`.

La connexion Supabase/Vercel et le déploiement sont une étape distincte. Voir `ETAT-DU-TRAVAIL.md` pour les limites restantes de la version locale.
