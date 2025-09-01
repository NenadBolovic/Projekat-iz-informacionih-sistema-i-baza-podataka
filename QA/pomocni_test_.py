import requests
import uuid
import mysql.connector
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from pymongo import MongoClient

konekcija = mysql.connector.connect(
    host="localhost",         
    port=3004,
    user="pisbp",
    password="pisbp",
    database="users"
)

klijent = MongoClient('mongodb://pisbp:pisbp@localhost:27017/')

databaza = klijent["formsquestionsdatabase"]
kolekcija = databaza["formscollection"]

sadrzaj = kolekcija.find()

for i in sadrzaj:
    print(i)

print("\n")

kursor = konekcija.cursor()
kursor.execute("use users;")
kursor.execute("select * from users")
listakorisnika = kursor.fetchall()

for i in listakorisnika:
    print(i)

#brisanje sadrzaja
kolekcija.delete_many({})
kveri = "DELETE FROM users WHERE firstname = %s"
ime = "testjoe"
ime2 = "ime"
ime3 = "kolaborator"
ime4 = "testjoe1"
kursor.execute(kveri, (ime,) )
kursor.execute(kveri, (ime2,) )
kursor.execute(kveri, (ime3,) )
kursor.execute(kveri, (ime4,) )
konekcija.commit()

kursor.close()
konekcija.close()

#napravi isto ovo za brisanje pitanja