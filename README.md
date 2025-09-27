# Projekat iz informacionih sistema i baza podataka


[Postavka zadatka](./Projektni_zadatak_PISIBP_2024.pdf) : Kreirati veb aplikaciju za kreiranje i upravljanje formularima, poput Google forms servisa.



Članovi tima Ctrl Alt Elite:  
Nenad Bolović 644/2021 - *frontend engineer*  
Luka Rafailović 639/2021 - *DevOps engineer*  
Viktor Radosavljević 604/2021 - *backend engineer*  
Milan Nedić 608/2021 - *quality assurance engineer*  

Nakon što je korisnik pulovao kod sa git repozitorijuma, može pokretati servise na dva načina.

**1)Lokalni build dvelopment. Ovaj pristup se koristi kada želite lokalni razvoj i debugging.**

a)Potrebno je prvo instalirati sve dependencies za svaki servis:
```
cd formsquestions 
npm install
cd ../answers
npm install
cd ../users
npm install
cd ../authentication
npm install
cd ../api-gateway
npm install
```
b)Pokrenuti build Docker slika
```
docker compose build
```
c)Pokrenuti kontejnere
```
docker compose up -d
```

Za pokretanje unit testova potrebno je izvršiti komande(primer za formsquestions)
```
cd formsquestions
npm test
```

**2)Korišćenje slika sa Docker Hub-a**

a)Pull gotovih Docker slika
```
docker compose -f docker-compose.pull.yml pull
```
b)Pokretanje kontejnera
```
docker compose -f docker-compose.pull.yml up -d
```
**3)Pokretanje integracionih testova**

Za pokretanje integracionih testova potrebno je instalirati sledeće Python pakete:
```
pip install selenium
pip install time
pip install random
pip install requests
pip install uuid
pip pymongo
pip install datetime
pip install json
pip install pytest
pip install argon2
pip install mysql.connector
```
Svi testovi se pokreću pomoću komade **pytest** u terminalu. Lokacija testova je folder QA.
```
cd QA
pytest
```

**Arhitektura aplikacije**
1)Frontend, React aplikacija komunicira sa API gateway-om
2)API gateway, Node/Express servis prosleđuje api pozive odgovarajućim mikroservisima(users,authentication,answers,formsquestions)
3)Users servis, Node/Express servis koji upravlja korisnicima, povezan sa MySQL bazom
4)Authentication servis, Node/Express zadužen za validaciju tokena, oslanja se na users servis prilikom registracije i prijavljivanje
5)Formsquestions servis, Node/Express servis koji upravlja formama i pitanjima, povezan sa MongoDB bazom formsquestionsdatabase
6)Answers servis, Node/Express servis koji upravlja odgovorima, povezan sa MongoDB bazom answersdatabase
7)MongoDB doker servis(mongo-db) sadrži baze podataka formsquestionsdatabase i answersdatabase
8)MySQL doker servis(users-db) sadrži bazu podataka users
