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

    assert dodavanjepitanja.status_code == 201

'''def test_odgovaranje_pitanja():
    urlslanjaodgovora = "http://localhost:3005/api/answers/answers"

    jsonodgovora1 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 0,
            "questionType" : "short-text",
            "answer" : "Odgovor"
            }        
        ]
    }

    jsonodgovora2 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 1,
            "questionType" : "long-text",
            "answer" : "OdgovorOdgovorOdgovorOdgovorOdgovorOdgovor"
            }        
        ]
    }

    jsonodgovora3 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 2,
            "questionType" : "multiple-choice-single",
            "answer" : 1
            }        
        ]
    }

    jsonodgovora4 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 3,
            "questionType" : "multiple-choice-multiple",
            "answer" : [1,3]
            }        
        ]
    }

    jsonodgovora5 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 6,
            "questionType" : "numeric",
            "answer" : 7
            }        
        ]
    }

    jsonodgovora6 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 5,
            "questionType" : "date",
            "answer" : "11.11.2011."
            }        
        ]
    }

    jsonodgovora7 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 6,
            "questionType" : "time",
            "answer" : "20:47"
            }        
        ]
    }

    files1 = {
        "answerData": (None, json.dumps(jsonodgovora1), 'application/json')
    }
    files2 = {
        "answerData": (None, json.dumps(jsonodgovora2), 'application/json')
    }
    files3 = {
        "answerData": (None, json.dumps(jsonodgovora3), 'application/json')
    }
    files4 = {
        "answerData": (None, json.dumps(jsonodgovora4), 'application/json')
    }
    files5 = {
        "answerData": (None, json.dumps(jsonodgovora5), 'application/json')
    }
    files6 = {
        "answerData": (None, json.dumps(jsonodgovora6), 'application/json')
    }
    files7 = {
        "answerData": (None, json.dumps(jsonodgovora7), 'application/json')
    }

    #print(files)

    dodavanjeodgovora1 = requests.post(urlslanjaodgovora, headers=Header, files=files1)
    dodavanjeodgovora2 = requests.post(urlslanjaodgovora, headers=Header, files=files2)
    dodavanjeodgovora3 = requests.post(urlslanjaodgovora, headers=Header, files=files3)
    dodavanjeodgovora4 = requests.post(urlslanjaodgovora, headers=Header, files=files4)
    dodavanjeodgovora5 = requests.post(urlslanjaodgovora, headers=Header, files=files1)
    dodavanjeodgovora6 = requests.post(urlslanjaodgovora, headers=Header, files=files1)
    dodavanjeodgovora7 = requests.post(urlslanjaodgovora, headers=Header, files=files1)

    brisanje1()
    
    assert dodavanjeodgovora1.status_code == 201 & dodavanjeodgovora2.status_code == 201 & dodavanjeodgovora3.status_code == 201 \
    & dodavanjeodgovora4.status_code == 201 & dodavanjeodgovora5.status_code == 201 & dodavanjeodgovora6.status_code == 201 \
    & dodavanjeodgovora7.status_code == 201'''

def test_prvi_odgovor():
    urlslanjaodgovora = "http://localhost:3005/api/answers/answers"

    jsonodgovora1 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 0,
            "questionType" : "short-text",
            "answer" : "Odgovor"
            }        
        ]
    }

    files1 = {
        "answerData": (None, json.dumps(jsonodgovora1), 'application/json')
    }

    dodavanjeodgovora1 = requests.post(urlslanjaodgovora, headers=Header, files=files1)

    assert dodavanjeodgovora1.status_code == 201

def test_drugi_odgovor():
    urlslanjaodgovora = "http://localhost:3005/api/answers/answers"

    jsonodgovora2 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 1,
            "questionType" : "long-text",
            "answer" : "OdgovorOdgovorOdgovorOdgovorOdgovorOdgovor"
            }        
        ]
    }

    files2 = {
        "answerData": (None, json.dumps(jsonodgovora2), 'application/json')
    }

    dodavanjeodgovora2 = requests.post(urlslanjaodgovora, headers=Header, files=files2)

    assert dodavanjeodgovora2.status_code == 201

def test_treci_odgovor():
    urlslanjaodgovora = "http://localhost:3005/api/answers/answers"

    jsonodgovora3 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 2,
            "questionType" : "multiple-choice-single",
            "answer" : "1"
            }        
        ]
    }

    files3 = {
        "answerData": (None, json.dumps(jsonodgovora3), 'application/json')
    }

    dodavanjeodgovora3 = requests.post(urlslanjaodgovora, headers=Header, files=files3)

    assert dodavanjeodgovora3.status_code == 201

def test_cetvrti_odgovor():
    urlslanjaodgovora = "http://localhost:3005/api/answers/answers"

    jsonodgovora4 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 3,
            "questionType" : "multiple-choice-single",
            "answer" : "1"
            }        
        ]
    }

    files4 = {
        "answerData": (None, json.dumps(jsonodgovora4), 'application/json')
    }

    dodavanjeodgovora4 = requests.post(urlslanjaodgovora, headers=Header, files=files4)

    assert dodavanjeodgovora4.status_code == 201

def test_peti_odgovor():
    urlslanjaodgovora = "http://localhost:3005/api/answers/answers"

    jsonodgovora5 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 5,
            "questionType" : "numeric",
            "answer" : "7"
            }        
        ]
    }

    files5 = {
        "answerData": (None, json.dumps(jsonodgovora5), 'application/json')
    }

    dodavanjeodgovora5 = requests.post(urlslanjaodgovora, headers=Header, files=files5)

    assert dodavanjeodgovora5.status_code == 201

def test_sesti_odgovor():
    urlslanjaodgovora = "http://localhost:3005/api/answers/answers"

    jsonodgovora6 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 6,
            "questionType" : "date",
            "answer" : "2011-11-11"
            }        
        ]
    }

    files6 = {
        "answerData": (None, json.dumps(jsonodgovora6), 'application/json')
    }

    dodavanjeodgovora6 = requests.post(urlslanjaodgovora, headers=Header, files=files6)

    assert dodavanjeodgovora6.status_code == 201

def test_sedmi_odgovor():
    urlslanjaodgovora = "http://localhost:3005/api/answers/answers"

    jsonodgovora7 = {
        "formId" : idforme,
        "answers" : [
            {
            "questionId" : 6,
            "questionType" : "time",
            "answer" : "20:11"
            }        
        ]
    }

    files7 = {
        "answerData": (None, json.dumps(jsonodgovora7), 'application/json')
    }

    dodavanjeodgovora7 = requests.post(urlslanjaodgovora, headers=Header, files=files7)

    assert dodavanjeodgovora7.status_code == 201