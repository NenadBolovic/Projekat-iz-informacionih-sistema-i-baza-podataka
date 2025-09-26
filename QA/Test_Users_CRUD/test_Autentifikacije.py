import requests
import uuid
import mysql.connector
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

konekcija = mysql.connector.connect(
    host="localhost",         
    port=3004,
    user="pisbp",
    password="pisbp",
    database="users"
)

ph = PasswordHasher()


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

def brisanje():
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

#testovi


def test_kreacija_aut():
    novi_korisnik = kreacija_jsona()
    global mejl
    global username
    mejl = novi_korisnik["email"]
    username = novi_korisnik["username"]

    url1 = 'http://localhost:3005/api/authentication/register'
    problem = requests.post(url1, json = novi_korisnik
    )

    postojanje = problem.status_code
    assert postojanje == 201

def test_citanje_aut():
    #prvo login pa onda search
    #znam da postoji ali iz nekog razloga ne moze biti pretrazeno

    url2 = "http://localhost:3005/api/authentication/login"
    sifra = "sifra"
    logovanje = requests.post(url2, json = {"username" : username, "password" : sifra})
    global token
    token = logovanje.json().get("token")

    url3 = "http://localhost:3005/api/users/users/search/" + str(username)

    global Header
    Header = {
        "Authorization" : f"Bearer {token}"
    }
    pretraga = requests.get(url3, headers=Header)

    postojanje2 = False
    if pretraga.json()["success"]==True:
        postojanje2 = True

    #print(pretraga.json()["success"])

    assert postojanje2 == True

def test_citanje_bez_autorizacije_aut():
    #prvo login pa onda search
    #znam da postoji ali iz nekog razloga ne moze biti pretrazeno

    url2 = "http://localhost:3005/api/authentication/login"
    sifra = "sifra"
    logovanje = requests.post(url2, json = {"username" : username, "password" : sifra})
    global token
    token = logovanje.json().get("token")

    url3 = "http://localhost:3005/api/users/users/search/" + str(username)

    global Header
    Header = {}

    pretraga = requests.get(url3, headers=Header)

    postojanje2 = False
    if pretraga.json()["success"]==True:
        postojanje2 = True

    #print(pretraga.json()["success"])

    assert postojanje2 == False

def test_update_aut():
    url4 = "http://localhost:3005/api/users/users/"

    starasifra = "sifra"
    novasifra = "novasifra"

    promenasifre = requests.patch(url4, headers=Header, json={"oldPassword" : starasifra, "newPassword" : novasifra})
    #print("\n",promenasifre.status_code,"\n")

    assert promenasifre.status_code == 401

def test_delete_aut():
    url5 = "http://localhost:3005/api/users/users/delete"

    brisanjekorisnika = requests.delete(url5, headers=Header)

    #print("\n",brisanjekorisnika.status_code,"\n")

    brisanje()

    assert brisanjekorisnika.status_code == 401