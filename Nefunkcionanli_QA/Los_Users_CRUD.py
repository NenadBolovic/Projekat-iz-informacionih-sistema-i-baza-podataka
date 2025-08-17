import requests
import uuid
import mysql.connector
import js2py
import os

#definisanje patha
skriptdir = os.path.dirname(__file__)
filepath = os.path.join(skriptdir, '..', 'users', 'db', 'userdatabase.js')
filepath = os.path.abspath(filepath)

with open(filepath, 'r') as file:
    jskod = file.read()

kontekst = js2py.EvalJs()
kontekst.execute(jskod)

konekcija = mysql.connector.connect(
    host="localhost",         
    port=3004,
    user="pisbp",
    password="pisbp",
    database="users"
)

def test_kreacija():
    #za prvi test je potrebna funkcija za kreaciju korisnika i za proveru postojanja korisnika
    #treba mi nova funkcija kreacije
    novi_korisnik = kreacija_jsona()
    global mejl
    mejl = "mile13@gmail.com"
    url = 'http://localhost:3005/api/authentication/register'
    kreacijakorisnika = requests.post({
        "firstname": "mile",
        "lastname": "milic",
        "username": "mile13",
        "password": "mile13",
        "email": "mile13@gmail.com"
        }
    )

    postojanje = provera_postojanja(mejl)

    assert postojanje == True


def test_citanje():
    postojanje2 = provera_postojanja(mejl)
    assert postojanje2 == True
    informacija = citanje(mejl)
    assert informacija != []

def test_apdejt():
    nova_sifra = "sifra2"
    stara_sifra = citanje(mejl)[4]
    apdejtovanje(nova_sifra, mejl)
    nova_nova_sifra = citanje(mejl)[4]
    assert stara_sifra != nova_nova_sifra
    
def test_brisanje():
    brisanje(mejl)
    postojanje3 = provera_postojanja(mejl)
    assert postojanje3 == False
    konekcija.close()


### Definisanje funkcija ###


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

def kreacija_C(korisnik):
    kursor1 = konekcija.cursor()
    kolumne = ', '.join (korisnik.keys())
    pomoc = ', '.join(['%s'] * len(korisnik))
    vrednosti = tuple(korisnik.values())
    kveri = f"INSERT INTO users ({kolumne}) VALUES ({pomoc})"

    kursor1.execute(kveri, vrednosti)
    konekcija.commit()
    kursor1.close()

def provera_postojanja(imejl):
    kursor2 = konekcija.cursor()
    kursor2.execute("use users;")
    kursor2.execute("select * from users")
    lista = kursor2.fetchall()
    postoji = False
    for i in lista:
        if i[5] == imejl:
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

def apdejtovanje(sifra, imejl):
    kursor4 = konekcija.cursor()
    #kursor4.execute("use users;")
    kursor4.execute("SELECT * FROM users")
    lista = kursor4.fetchall()
    query = """UPDATE users
               SET password = SHA2(%s, 256)
               WHERE email = %s
            """
    kursor4.execute(query, (sifra, imejl))
    konekcija.commit()
    kursor4.close()

def brisanje(imejl):
    kursor = konekcija.cursor()
    kveri = "DELETE FROM users WHERE email = %s"
    kursor.execute(kveri, (imejl,))
    konekcija.commit()

#konekcija.close()