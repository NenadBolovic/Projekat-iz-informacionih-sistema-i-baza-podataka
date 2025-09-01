import requests
import uuid
from pymongo import MongoClient
import datetime
import json
from test_Users_CRUD import kreacija_jsona
from test_Formulari_CRUD import kreacijaforme
import time

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

#mozda prvo treba da dodam pitanja, pa onda da dokazem da ne mogu da se dodaju?

def test_dodavanja_pitanja():
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

def test_lockovanje():
    urlpretrage = "http://localhost:3005/api/formsquestions/forms/search?q=CRUD"
    promenaforma = requests.get(urlpretrage, headers=Header)

    jsoni = promenaforma.json()
    prvaforma = jsoni["forms"][0]
    global idforme
    idforme = prvaforma["_id"]

    promenjenaforma = {
        "formId": idforme,
        "name": prvaforma["name"],
        "description": "Skroz dobra deskripcija",
        "indicator": 1,
        "locked": 1,
        "collaborators": [],
        "observers": []
    }

    urlpromene = "http://localhost:3005/api/formsquestions/forms/updateForm"
    promena = requests.patch(urlpromene, headers=Header, json=promenjenaforma)
    
    assert promena.status_code == 200

def test_lockovano_odgovaranje():
    #iz nekog razloga se pitanja uspesno kreiraju, ne znam zasto, moram proveriti.
    urlslanjaodgovora2 = "http://localhost:3005/api/answers/answers"

    jsonodgovora2 = {
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
        "answerData": (None, json.dumps(jsonodgovora2), 'application/json')
    }

    dodavanjeodgovora = requests.post(urlslanjaodgovora2, headers=Header, files=files)
    
    assert dodavanjeodgovora.status_code == 403

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