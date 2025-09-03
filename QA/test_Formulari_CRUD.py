import requests
import uuid
from pymongo import MongoClient
import datetime
import json
from test_Users_CRUD import kreacija_jsona

#definisanje funkcija

def kreacijaforme():
    name = "CRUD"
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


#definisanje testova


def test_kreacije():
    proto_korisnik = kreacija_jsona()

    #registracija
    urlregistracija = 'http://localhost:3005/api/authentication/register'
    global mejl
    global username
    mejl = proto_korisnik["email"]
    username = proto_korisnik["username"]
    registracija = requests.post(urlregistracija, json = proto_korisnik)

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

def test_citanja():
    urlcitanja = "http://localhost:3005/api/formsquestions/forms/related"
    citanje = requests.get(urlcitanja, headers=Header)

    assert citanje.status_code == 200
    
def test_update():
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
        "collaborators": [],
        "observers": []
    }

    urlpromene = "http://localhost:3005/api/formsquestions/forms/updateForm"
    promena = requests.patch(urlpromene, headers=Header, json=promenjenaforma)

    assert promena.status_code == 200

def test_brisanje():
    urlbrisanja = "http://localhost:3005/api/formsquestions/forms/deleteForm"
    jsonbrisanja = {
        "formId" : idforme
    }
    brisanje = requests.delete(urlbrisanja, headers=Header, json=jsonbrisanja)
    assert brisanje.status_code == 200

def test_delete_user():
    url5 = "http://localhost:3005/api/users/users/delete"

    brisanjekorisnika = requests.delete(url5, headers=Header)

    #print("\n",brisanjekorisnika.status_code,"\n")

    assert brisanjekorisnika.status_code == 200