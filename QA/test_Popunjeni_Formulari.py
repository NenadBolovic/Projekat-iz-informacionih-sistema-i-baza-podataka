#za grouped answers se koristi id forme i redni broj pitanja na koje se odgovara, konkretno question id (odgovori svih korisnika na odredjeno pitanje iz odredjene forme)

#za odgovore korisnika se koristi id forme i id korisnika (ovo su svi odgovori koje je jedan korisnik poslao)

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

def test_dobijanje_user_ida():
    urlpretragekorisnik = "http://localhost:3005/api/users/users/search/" + str(username)

    trazenikorisnik = requests.get(urlpretragekorisnik, headers=Header)

    sadrzaj = trazenikorisnik.json()
    #print(sadrzaj)
    korisnik = sadrzaj["users"][0]
    
    global idkorisnika
    idkorisnika = korisnik["userId"]

    postojanje = False
    if idkorisnika:
        postojanje = True

    assert postojanje == True

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

def test_grupirani_odgovori():
    urlgrupirano = "http://localhost:3005/api/answers/answers/getGroupedAnswers/" + str(idforme) + "/0"

    grupiraniodgovori = requests.get(urlgrupirano, headers=Header)

    assert grupiraniodgovori.status_code == 200

def test_svi_odgovori_korisnika():
    urlsvi = "http://localhost:3005/api/answers/answers/getUsersAnswers/" + str(idforme) + "/" + str(idkorisnika)

    sviodgovori = requests.get(urlsvi, headers=Header)

    assert sviodgovori.status_code == 200

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