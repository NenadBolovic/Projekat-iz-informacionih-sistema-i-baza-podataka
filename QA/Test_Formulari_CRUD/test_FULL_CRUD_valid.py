import requests
import uuid
from pymongo import MongoClient
import datetime
import json

#definisanje funkcija

def kreacija_jsona():
    #unikatan username i imejl
    username = uuid.uuid4().hex
    email = f"{uuid.uuid4().hex}@gmail.com"
    sadrzaj = {
        "firstname": "ime",
        "lastname": "prezime",
        "username": username,
        "password": "sifra",
        "email": email
    }

    return sadrzaj

def kreacijaforme():
    dodatakimena = str(uuid.uuid4().hex)
    global name
    name = "CRUD" + dodatakimena
    description = "test deskripcija"
    indicator = 0
    locked = 0
    #authID = 1
    collaborators = []
    observers = []
    questions = []
    #createdAt = datetime.datetime.now()
    #updatedAt = datetime.datetime.now()
    #__v = 0

    formaldehid = {
        "name" : name,
        "description" : description,
        "indicator" : indicator,
        "locked" : locked,
        #"authID" : authID,
        "collaborators" : collaborators,
        "observers" : observers,
        "questions" : questions
        #"createdAt" : createdAt,
        #"updatedAt" : updatedAt,
        #"__v" : __v
    }

    return formaldehid

def brisanje1():
    url2 = "http://localhost:3005/api/authentication/login"
    sifra = "sifra"
    logovanje = requests.post(url2, json = {"username" : username, "password" : sifra})
    global token
    token = logovanje.json().get("token")
    Header = {
        "Authorization" : f"Bearer {token}"
    }

    url5 = "http://localhost:3005/api/users/users/delete"

    brisanjekorisnika = requests.delete(url5, headers=Header)

    urlpretrage = "http://localhost:3005/api/formsquestions/forms/search?q=" + name
    promenaforma = requests.get(urlpretrage, headers=Header)

    jsoni = promenaforma.json()
    prvaforma = jsoni["forms"][0]
    idforme = prvaforma["_id"]

    urlbrisanja = "http://localhost:3005/api/formsquestions/forms/deleteForm"
    jsonbrisanja = {
        "formId" : idforme
    }

    brisanje = requests.delete(urlbrisanja, headers=Header, json=jsonbrisanja)

#definisanje testova


def test_kreacije():
    proto_korisnik = kreacija_jsona()

    #registracija
    urlregistracija = 'http://localhost:3005/api/authentication/register'
    global mejl
    global username
    global id11
    mejl = proto_korisnik["email"]
    username = proto_korisnik["username"]
    registracija = requests.post(urlregistracija, json = proto_korisnik)
    #id11 = registracija.json()

    #print(registracija.json())

    #logovanje
    urllogovanje = "http://localhost:3005/api/authentication/login"
    sifra = "sifra"
    logovanje = requests.post(urllogovanje, json = {"username" : username, "password" : sifra})

    #print(logovanje.json())

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

    #print(kreacija.json())

    assert kreacija.status_code == 201

def test_citanja():
    urlpretrage = "http://localhost:3005/api/formsquestions/forms/search?q=" + name
    promenaforma = requests.get(urlpretrage, headers=Header)

    sadrzaj = promenaforma.json()["forms"]

    postoji = False
    if sadrzaj != []:
        postoji = True
    
    assert postoji == True
    
def test_update():
    #treba da izvucem form id, napravim novu formu i da to prosledim
    urlpretrage = "http://localhost:3005/api/formsquestions/forms/search?q=" + name
    promenaforma = requests.get(urlpretrage, headers=Header)
    #print(promenaforma)
    #kreacija korisnih podataka
    
    jsoni = promenaforma.json()
    prvaforma = jsoni["forms"][0]
    global idforme
    idforme = prvaforma["_id"]

    #print(prvaforma["authId"])
    #print(prvaforma)
    #print(id11)

    promenjenaforma = {
        "formId": idforme,
        "name": prvaforma["name"],
        "description": "Skroz dobra deskripcija",
        "indicator": 0,
        "locked": 0,
        "collaborators": [],
        "observers": []
    }

    #print(idforme)
    #print(Header)
    urlpromene = "http://localhost:3005/api/formsquestions/forms/updateForm"
    promena = requests.patch(urlpromene, headers=Header, json=promenjenaforma)

    assert promena.status_code == 200

def test_brisanje():
    urlbrisanja = "http://localhost:3005/api/formsquestions/forms/deleteForm"
    jsonbrisanja = {
        "formId" : idforme
    }

    #brisanje Korisnika

    url5 = "http://localhost:3005/api/users/users/delete"

    brisanjekorisnika = requests.delete(url5, headers=Header)

    brisanje = requests.delete(urlbrisanja, headers=Header, json=jsonbrisanja)
    assert brisanje.status_code == 200