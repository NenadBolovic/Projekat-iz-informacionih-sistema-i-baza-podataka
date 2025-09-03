import requests
import uuid
from pymongo import MongoClient
import datetime
import json
from test_Users_CRUD import kreacija_jsona
from test_Formulari_CRUD import kreacijaforme
import time
from selenium.webdriver.chrome.service import Service


def kreacija_kolaboratora():
    #unikatan username i imejl
    username = uuid.uuid4().hex
    email = f"{uuid.uuid4().hex}@gmail.com"
    sadrzaj = {
        "firstname": "kolaborator",
        "lastname": "kolaborator",
        "username": username,
        "password": "sifra",
        "email": email
    }

    return sadrzaj


def test_inicijalna_forma():
    #registracija
    inicijalnikorisnik = kreacija_jsona()
    urlregistracija = 'http://localhost:3005/api/authentication/register'
    global mejl
    global username
    mejl = inicijalnikorisnik["email"]
    username = inicijalnikorisnik["username"]
    registracija = requests.post(urlregistracija, json = inicijalnikorisnik)

    kolaborator = kreacija_kolaboratora()
    global mejlkolab 
    global usernamekolab
    mejlkolab = kolaborator["email"]
    usernamekolab = kolaborator["username"]
    registracija2 = requests.post(urlregistracija, json = kolaborator)

    #logovanje
    urllogovanje = "http://localhost:3005/api/authentication/login"
    sifra = "sifra"
    logovanje = requests.post(urllogovanje, json = {"username" : username, "password" : sifra})    
    
    global token
    token = logovanje.json().get("token")
    global Header
    Header = {
        "Authorization" : f"Bearer {token}",
    }
    urlkreacija = 'http://localhost:3005/api/formsquestions/forms'
    protoforma = kreacijaforme()

    files = {
        "formData": (None, json.dumps(protoforma), 'application/json')
    }

    kreacija = requests.post(urlkreacija, headers=Header, files=files)

    assert kreacija.status_code == 201

#dakle, fora je da dodam korisnika koji moze pristupiti formi, za ovo mi je potreban id oba korisnika

def test_nalazenje_kolaborator_id():
    url3 = "http://localhost:3005/api/users/users/search/" + str(username)

    global Header
    Header = {
        "Authorization" : f"Bearer {token}"
    }
    pretraga = requests.get(url3, headers=Header)
    korisnik = pretraga.json()
    korisnikinfo = korisnik["users"]

    global idkolaboratora
    idkolaboratora = int(korisnikinfo[0]["userId"])
    
    postojanje = False
    if idkolaboratora:
        postojanje = True

    assert postojanje == True

def test_update_kolaborator():
    #treba da izvucem form id, napravim novu formu i da to prosledim
    urlpretrage = "http://localhost:3005/api/formsquestions/forms/search?q=CRUD"
    promenaforma = requests.get(urlpretrage, headers=Header)
    #print(promenaforma)
    #kreacija korisnih podataka
    
    jsoni = promenaforma.json()
    prvaforma = jsoni["forms"][0]
    global idforme
    idforme = prvaforma["_id"]

    promenjenaforma = {
        "formId": idforme,
        "name": prvaforma["name"],
        "description": "Skroz dobra deskripcija",
        "indicator": 0,
        "locked": 0,
        "collaborators": [idkolaboratora],
        "observers": []
    }

    urlpromene = "http://localhost:3005/api/formsquestions/forms/updateForm"
    promena = requests.patch(urlpromene, headers=Header, json=promenjenaforma)

    assert promena.status_code == 200

def test_brisanje_forme():
    urlbrisanja = "http://localhost:3005/api/formsquestions/forms/deleteForm"
    jsonbrisanja = {
        "formId" : idforme
    }
    brisanje = requests.delete(urlbrisanja, headers=Header, json=jsonbrisanja)
    assert brisanje.status_code == 200

#ne mogu naci ovog kolaboratora iz nekog razloga

def test_delete_user():
    url5 = "http://localhost:3005/api/users/users/delete"

    brisanjekorisnika = requests.delete(url5, headers=Header)

    #print("\n",brisanjekorisnika.status_code,"\n")

    assert brisanjekorisnika.status_code == 200

def test_brisanje_kolaboratora():
    urllogovanje = "http://localhost:3005/api/authentication/login"
    sifra = "sifra"
    logovanje = requests.post(urllogovanje, json = {"username" : usernamekolab, "password" : sifra})
    #print(logovanje.status_code)
    #moram redefinisati header token

    token = logovanje.json().get("token")
    Header = {
        "Authorization" : f"Bearer {token}",
    }

    url5 = "http://localhost:3005/api/users/users/delete"

    brisanjekolab = requests.delete(url5, headers=Header)

    assert brisanjekolab.status_code == 200