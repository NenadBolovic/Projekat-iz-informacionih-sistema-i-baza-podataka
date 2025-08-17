import requests
import uuid
from pymongo import MongoClient
import datetime
import json
from test_Users_CRUD import kreacija_jsona
from test_Formulari_CRUD import kreacijaforme

#treba definisati formular sa svim vrstama pitanja

#definisanje funkcija



#definisanje testova

def test_inicijalna_forma():
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

    assert kreacija.status_code == 201

def test_dobijanja_ida():
    urlpretrage = "http://localhost:3005/api/formsquestions/forms/search?q=CRUD"
    promenaforma = requests.get(urlpretrage, headers=Header)

    jsoni = promenaforma.json()
    prvaforma = jsoni["forms"][0]
    global idforme
    idforme = 0
    idforme = prvaforma["_id"]

    assert idforme != 0

def test_dodavanja_pitanja():
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

    assert dodavanjepitanja.status_code == 201