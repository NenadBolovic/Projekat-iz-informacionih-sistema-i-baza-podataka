#za grouped answers se koristi id forme i redni broj pitanja na koje se odgovara, konkretno question id (odgovori svih korisnika na odredjeno pitanje iz odredjene forme)

#za odgovore korisnika se koristi id forme i id korisnika (ovo su svi odgovori koje je jedan korisnik poslao)

import requests
import uuid
from pymongo import MongoClient
import datetime
import json
import time

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


def test_dodavanja_pitanja():
    #kreacija forme 
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

    #dobijanje id forme
    urlpretrage = "http://localhost:3005/api/formsquestions/forms/search?q=" + name
    promenaforma = requests.get(urlpretrage, headers=Header)

    jsoni = promenaforma.json()
    prvaforma = jsoni["forms"][0]
    global idforme
    idforme = 0
    idforme = prvaforma["_id"]

    #dobijanje id korisnika
    urlpretragekorisnik = "http://localhost:3005/api/users/users/search/" + str(username)

    trazenikorisnik = requests.get(urlpretragekorisnik, headers=Header)

    sadrzaj = trazenikorisnik.json()
    #print(sadrzaj)
    korisnik = sadrzaj["users"][0]
    
    global idkorisnika
    idkorisnika = korisnik["userId"]

    #zapravo rad

    urlzadodavanje = "http://localhost:3005/api/formsquestions/questions/addQuestions"

    nelosjson = {
        "formId" : idforme,
        "questions" : [
            {
                "questionText" : "multiple-choice-single",
                "questionType" : "multiple-choice-single",
                "options" : [
                    {"text" : "Jedan"},
                    {"text" : "Dva"},
                    {"text" : "Tri"}
                ]
            }
        ]
    }

    files = {
        "formData": (None, json.dumps(nelosjson), 'application/json')
    }

    dodavanjepitanja = requests.post(urlzadodavanje, headers=Header,files=files)

    assert dodavanjepitanja.status_code == 201

def test_slanje_odgovora():
    urlslanjaodgovora = "http://localhost:3005/api/answers/answers"

    jsonodgovora = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 0,
            "questionType" : "multiple-choice-single",
            "answer" : "Jedan"
            }        
        ]
    }

    files = {
        "answerData": (None, json.dumps(jsonodgovora), 'application/json')
    }

    #print(files)

    dodavanjeodgovora = requests.post(urlslanjaodgovora, headers=Header, files=files)
    
    assert dodavanjeodgovora.status_code == 201
    

def test_grupirani_odgovori():
    urlgrupirano = "http://localhost:3005/api/answers/answers/getGroupedAnswers/" + str(idforme) + "/0"

    grupiraniodgovori = requests.get(urlgrupirano, headers=Header)

    #print("\n",grupiraniodgovori.json())

    assert grupiraniodgovori.status_code == 200

def test_svi_odgovori_korisnika():
    urlsvi = "http://localhost:3005/api/answers/answers/getUsersAnswers/" + str(idforme) + "/" + str(idkorisnika)

    sviodgovori = requests.get(urlsvi, headers=Header)

    #print("\n",sviodgovori.json())

    brisanje1()

    assert sviodgovori.status_code == 200