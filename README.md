# CAS-IN
CAS-IN
Parce que gérer l'authentification ne devrait pas être une punition divine.

CAS-IN est là pour simplifier l'intégration du protocole Central Authentication Service (CAS). Voilà, c'est dit. C'est simple, c'est efficace, et ça évite de s'arracher les cheveux sur des configurations XML de 1998.

🚀 Pourquoi ce truc ?
On sait tous comment ça se passe : on veut juste que l'utilisateur se connecte, et on finit par lire des RFC de 50 pages. CAS-IN fait le sale boulot pour toi.

Intégration rapide : On branche, ça marche.

Léger : Pas besoin d'un serveur de la NASA pour le faire tourner.

Sécurisé : Enfin, aussi sécurisé que ton code le permet, hein.

🛠️ Installation (Si tu as survécu au terminal)
D'abord, on récupère le bébé :

Bash
git clone https://github.com/Zufferdi/CAS-IN.git
cd CAS-IN
Ensuite, on installe les dépendances. Je ne sais pas si tu es plutôt pip, npm ou composer, mais lance ta commande magique.
Exemple pour les gens civilisés :

Bash
pip install -r requirements.txt
Et voilà, on est déjà à mi-chemin.

⚙️ Configuration
Va falloir mettre les mains dans le cambouis (un peu). Ouvre ton fichier de conf et remplace les placeholders. Ne me laisse pas "admin/admin" en prod, par pitié.

YAML
cas_server: "https://votre-serveur-cas.com"
service_url: "https://votre-app.com"
📖 Utilisation
Pour lancer la machine :

Bash
python main.py # Ou n'importe quelle commande qui lance ton génie
Une fois que c'est fait, tu pointes ton navigateur sur localhost et tu pries. On est bons ?

🤝 Contribution
Si tu trouves un bug ou si tu as une illumination, n'hésite pas à faire une Pull Request. Je ne mords pas, sauf si tu oublies les points-virgules (selon le langage).

📄 Licence
Sous licence MIT. Fais-en ce que tu veux, tant que tu ne m'envoies pas tes factures d'avocat.
