import uuid
from pymongo import MongoClient
import datetime

klijent = MongoClient('mongodb://pisbp:pisbp@localhost:27017/')

databaza = klijent["formsquestionsdatabase"]
kolekcija = databaza["formscollection"]
kolekcija2 = databaza["questionscollection"]

#ovo je vrednost id polja: 682f06da92f463222a1f967f, nema "ObjectID deo"

#testovi
def test_popunjenja():
    forma = kreacijaforme()
    indeks = kreacija(forma)
    global AJDI
    AJDI = indeks

    popuniformular(AJDI)
    lista = ['short-text','long-text','multiple-choice-single','multiple-choice-multiple','numeric','date','time']

    for i in range(7):
        pitanje = kolekcija2.find_one({"formId" : AJDI, "questionId" : i})
        #print(pitanje, "\n", i)
        assert pitanje["questionType"] == lista[i]


#definisanje funkcija


def kreacijaforme():
    name = "test_potpuni_formular"
    description = "test_potpuni_formular"
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

def popuniformular(id):
    #short text
    kolekcija2.insert_one({
        "formId" : id,
        "questionId" : 0,
        "questionText" : "short-text",
        "questionType" : "short-text",
        "required" : True,
        "options" : [],
        "numericAttributes" : {
            "min" : None,
            "max" : None,
            "step" : 1
        },
        "questionImage" : None,
        "__v" : 0,
        "createdAt" : datetime.datetime.now(),
        "UpdatedAt" : datetime.datetime.now()
    })

    #long text
    kolekcija2.insert_one({
        "formId" : id,
        "questionId" : 1,
        "questionText" : "long-text",
        "questionType" : "long-text",
        "required" : True,
        "options" : [],
        "numericAttributes" : {
            "min" : None,
            "max" : None,
            "step" : 1
        },
        "questionImage" : None,
        "__v" : 0,
        "createdAt" : datetime.datetime.now(),
        "UpdatedAt" : datetime.datetime.now()
    })

    #multiple choice single
    kolekcija2.insert_one({
        "formId" : id,
        "questionId" : 2,
        "questionText" : "multiple-choice-single",
        "questionType" : "multiple-choice-single",
        "required" : True,
        "options" : [
            {"text" : 1},
            {"text" : 2},
            {"text" : 3}
        ],
        "numericAttributes" : {
            "min" : None,
            "max" : None,
            "step" : 1
        },
        "questionImage" : None,
        "__v" : 0,
        "createdAt" : datetime.datetime.now(),
        "UpdatedAt" : datetime.datetime.now()
    })

    #multiple choice multiple
    kolekcija2.insert_one({
        "formId" : id,
        "questionId" : 3,
        "questionText" : "multiple-choice-multiple",
        "questionType" : "multiple-choice-multiple",
        "required" : True,
        "options" : [
            {"text" : 1},
            {"text" : 2},
            {"text" : 3}
        ],
        "numericAttributes" : {
            "min" : None,
            "max" : None,
            "step" : 1
        },
        "questionImage" : None,
        "__v" : 0,
        "createdAt" : datetime.datetime.now(),
        "UpdatedAt" : datetime.datetime.now()
    })

    #numeric
    kolekcija2.insert_one({
        "formId" : id,
        "questionId" : 4,
        "questionText" : "numeric",
        "questionType" : "numeric",
        "required" : True,
        "numericAttributes" : {
            "min" : 1,
            "max" : 10,
            "step" : 1
        },
        "questionImage" : None,
        "__v" : 0,
        "createdAt" : datetime.datetime.now(),
        "UpdatedAt" : datetime.datetime.now()
    })

    #date
    kolekcija2.insert_one({
        "formId" : id,
        "questionId" : 5,
        "questionText" : "date",
        "questionType" : "date",
        "required" : True,
        "options" : [],
        "numericAttributes" : {
            "min" : None,
            "max" : None,
            "step" : 1
        },
        "questionImage" : None,
        "__v" : 0,
        "createdAt" : datetime.datetime.now(),
        "UpdatedAt" : datetime.datetime.now()
    })

    #time
    kolekcija2.insert_one({
        "formId" : id,
        "questionId" : 6,
        "questionText" : "time",
        "questionType" : "time",
        "required" : True,
        "options" : [],
        "numericAttributes" : {
            "min" : None,
            "max" : None,
            "step" : 1
        },
        "questionImage" : None,
        "__v" : 0,
        "createdAt" : datetime.datetime.now(),
        "UpdatedAt" : datetime.datetime.now()
    })