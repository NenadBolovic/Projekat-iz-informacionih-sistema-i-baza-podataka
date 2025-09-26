import requests
import uuid
from pymongo import MongoClient
import datetime
import json

#treba definisati formular sa svim vrstama pitanja

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
def test_dodavanja_pitanja():
    #kreacija inicijalne forme
    #registracija
    inicijalnikorisnik = kreacija_jsona()
    urlregistracija = 'http://localhost:3005/api/authentication/register'
    global mejl
    global username
    mejl = inicijalnikorisnik["email"]
    username = inicijalnikorisnik["username"]
    registracija = requests.post(urlregistracija, json = inicijalnikorisnik)

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

    #dobijanje ida
    urlpretrage = "http://localhost:3005/api/formsquestions/forms/search?q=" + name
    promenaforma = requests.get(urlpretrage, headers=Header)

    jsoni = promenaforma.json()
    prvaforma = jsoni["forms"][0]
    global idforme
    idforme = 0
    idforme = prvaforma["_id"]

    #dodavanje pitanja
    urlzadodavanje = "http://localhost:3005/api/formsquestions/questions/addQuestions"

    nelosjson = {
        "formId" : idforme,
        "questions" : [
            {
                "questionText" : "short-text",
                "questionType" : "short-text",
                "options" : []
            },
            {
                "questionText" : "long-text",
                "questionType" : "long-text",
                "options" : []

            },
            {
                "questionText" : "multiple-choice-single",
                "questionType" : "multiple-choice-single",
                "options" : [
                    {"text" : 1},
                    {"text" : 2},
                    {"text" : 3}
                ]
            },
            {
                "questionText" : "multiple-choice-multiple",
                "questionType" : "multiple-choice-multiple",
                "options" : [
                    {"text" : 1},
                    {"text" : 2},
                    {"text" : 3}
                ]
            },
            {
                "questionText" : "numeric",
                "questionType" : "numeric",
                "numericAttributes" : {
                    "min" : 1,
                    "max" : 10,
                    "step" : 1
                }
            },
            {
                "questionText" : "date",
                "questionType" : "date",
                "options" : []
            },
            {
                "questionText" : "time",
                "questionType" : "time",
                "options" : []
            }
        ]
    }

    files = {
        "formData": (None, json.dumps(nelosjson), 'application/json')
    }

    dodavanjepitanja = requests.post(urlzadodavanje, headers=Header,files=files)

    brisanje1()

    assert dodavanjepitanja.status_code == 201