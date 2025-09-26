# Projekat iz informacionih sistema i baza podataka


[Postavka zadatka](./Projektni_zadatak_PISIBP_2024.pdf) : Kreirati veb aplikaciju za kreiranje i upravljanje formularima, poput Google forms servisa.



Članovi tima Ctrl Alt Elite:  
Nenad Bolović 644/2021 - *frontend engineer*  
Luka Rafailović 639/2021 - *DevOps engineer*  
Viktor Radosavljević 604/2021 - *backend engineer*  
Milan Nedić 608/2021 - *quality assurance engineer*  

Nakon što je korisnik pulovao kod sa git repozitorijuma, može pokretati servise na dva načina.

*1)Lokalni build dvelopment. Ovaj pristup se koristi kada želite lokalni razvoj i debugging.
*a)Potrebno je prvo instalirati sve dependencies za svaki servis:
```bash
cd formsquestions 
npm install
cd ../answers
npm install
cd ../users
npm install
cd ../authentication
npm install
cd ../api-gateway
npm install```
*b)Pokrenuti build slika
```bash
docker compose build```
*c)Pokrenuti kontejnere
```bash
docker compose up -d```

**2)Korišćenje slika sa Docker Hub-a**
*a)Pull gotovih slika
```bash
docker compose -f docker-compose.pull.yml pull```
*b)Pokretanje kontejnera
```bash
docker compose -f docker-compose.pull.yml up -d```



