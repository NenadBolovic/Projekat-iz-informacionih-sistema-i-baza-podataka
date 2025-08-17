import requests
import uuid
from pymongo import MongoClient
import datetime

klijent = MongoClient('mongodb://pisbp:pisbp@localhost:27017/')

databaza = klijent["formsquestionsdatabase"]
kolekcija = databaza["formscollection"]

def test_kreacija():
    forma = kreacijaforme()
    indeks = kreacija(forma)
    #print(indeks)

    global AJDI
    AJDI = indeks

    assert indeks != ""

def test_citanje():
    radnaforma = citanjeforme(AJDI)
    noviindeks = radnaforma["_id"]

    assert noviindeks == AJDI

def test_update():
    radnaforma = citanjeforme(AJDI)
    deskripcija1 = radnaforma["description"]

    novadeskripcija = "nova " + str(uuid.uuid4().hex)
    updatovanjeformedeskripcija(novadeskripcija)

    radnaforma2 = citanjeforme(AJDI)
    deskripcija2 = radnaforma2["description"]

    assert deskripcija1 != deskripcija2

def test_brisanja():
    brisanjeforme()
    postojanje = proverapostojanjaforme()
    assert postojanje == False


### Definisanje funkcija ###


def kreacijaforme():
    name = uuid.uuid4().hex
    description = uuid.uuid4().hex
    indicator = 0
    locked = 0
    authID = 1
    collaborators = []
    observers = []
    createdAt = datetime.datetime.now()
    updatedAt = datetime.datetime.now()
    __v = 0

    formaldehid = {
        "name" : name,
        "description" : description,
        "indicator" : indicator,
        "locked" : locked,
        "authID" : authID,
        "collaborators" : collaborators,
        "observers" : observers,
        "createdAt" : createdAt,
        "updatedAt" : updatedAt,
        "__v" : __v
    }

    return formaldehid

def kreacija(formaideale):
    rezultat = kolekcija.insert_one({
        "name" : formaideale["name"],
        "description" : formaideale["description"],
        "indicator" : formaideale["indicator"],
        "locked" : formaideale["locked"],
        "authID" : formaideale["authID"],
        "collaborators" : formaideale["collaborators"],
        "observers" : formaideale["observers"],
        "createdAt" : formaideale["createdAt"],
        "updatedAt" : formaideale["updatedAt"],
        "__v" : formaideale["__v"]
    })

    return rezultat.inserted_id

def citanjeforme(indeks):
    rezultat = kolekcija.find_one({"_id" : indeks})
    return rezultat

def updatovanjeformedeskripcija(novadeskripcija):
    rezultat0 = kolekcija.update_one(
        {"_id" : AJDI}, 
        {"$set" : {"description" : novadeskripcija, "updatedAt" : datetime.datetime.now()}}
    )

def brisanjeforme():
    rezultat = kolekcija.delete_one({"_id" : AJDI})

def proverapostojanjaforme():
    postoji = False
    for i in kolekcija.find():
        if i["_id"] == AJDI:
            postoji = True
            break
    return postoji