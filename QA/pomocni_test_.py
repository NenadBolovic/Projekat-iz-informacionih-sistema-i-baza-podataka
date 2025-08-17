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
kursor.execute(kveri, (ime,) )
kveri2 = "DELETE FROM users WHERE firstname = %s"
ime2 = "ime"
kursor.execute(kveri, (ime2,) )
konekcija.commit()

kursor.close()
konekcija.close()