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

def provera_postojanja(imejl):
    kursor2 = konekcija.cursor()
    kursor2.execute("use users;")
    kursor2.execute("select * from users")
    lista = kursor2.fetchall()
    postoji = False
    brojac = 0
    for i in lista:
        gmail = i[5]
        #print("\n", gmail, "\n", imejl, "\n")
        if gmail == imejl:
            print("\n", i, "\n")
            postoji = True
            break
    kursor2.close()
    return postoji

def citanje(imejl):
    kursor3 = konekcija.cursor()
    #kursor3.execute("use users;")
    kursor3.execute("SELECT * FROM users")
    lista = kursor3.fetchall()
    zeljeno = []
    for i in lista:
        if i[5] == imejl:
            zeljeno = i
            break
    kursor3.close()
    return zeljeno


#testovi


def test_kreacija():
    novi_korisnik = kreacija_jsona()
    global mejl
    global username
    mejl = novi_korisnik["email"]
    username = novi_korisnik["username"]

    url1 = 'http://localhost:3005/api/authentication/register'
    problem = requests.post(url1, json = novi_korisnik
    )

    postojanje = provera_postojanja(mejl)
    assert postojanje == True

def test_citanje():
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
    if pretraga:
        postojanje2 = True

    assert postojanje2 == True

def test_update():
    url4 = "http://localhost:3005/api/users/users/"

    starasifra = "sifra"
    novasifra = "novasifra"

    promenasifre = requests.patch(url4, headers=Header, json={"oldPassword" : starasifra, "newPassword" : novasifra})
    #print("\n",promenasifre.status_code,"\n")

    assert promenasifre.status_code == 201

def test_delete():
    url5 = "http://localhost:3005/api/users/users/delete"

    brisanjekorisnika = requests.delete(url5, headers=Header)

    #print("\n",brisanjekorisnika.status_code,"\n")

    assert brisanjekorisnika.status_code == 200