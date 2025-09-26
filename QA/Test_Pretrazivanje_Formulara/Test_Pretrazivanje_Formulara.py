import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import time
import random

@pytest.fixture
def driver():
    service = Service()  
    driver = webdriver.Chrome(service=service)
    yield driver
    driver.quit()

def test_regkor(driver):
    #nalazenje i otvaranje log in/sign up prozora
    driver.get("http://localhost:3000/")
    time.sleep(3)

    dugme_ikonica = driver.find_element(By.XPATH, 
        "//button[@aria-label='Account menu']")
    
    time.sleep(3)
    
    dugme_ikonica.click()
    #time.sleep(3)

    #selektovanje sign up dugmeta
    dugme_sign_up = driver.find_element(By.XPATH, 
        "//a[text()='Sign Up']")
    dugme_sign_up.click()

    #Unosenje elemenata, jedan po jedan
    #Ime
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[1]//input")
    dugme_input.send_keys("Quality Assurance")
    #Prezime
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[2]//input")
    dugme_input.send_keys("Quality Assurance")
    #Username
    global string
    integer = random.randint(1,10000000)
    string = str(integer)
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[3]//input")
    dugme_input.send_keys("Quality Assurance" + string)
    #Email
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[4]//input")
    dugme_input.send_keys("QualityAssurance" + string + "@gmail.com")
    #Passworc
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[5]//input")
    dugme_input.send_keys("Quality Assurance")

    dugme_signup = driver.find_element(By.XPATH, "//div[@class='login-box']//form//button")
    dugme_signup.click()

    time.sleep(3)

    provera_paragraf = driver.find_element(By.XPATH, "//div[@class='login-box']//p[2]")
    provera_paragraf_text = provera_paragraf.text

    time.sleep(3)

    assert provera_paragraf_text == "Registration successful! You can now log in."

def test_login(driver):
    driver.get("http://localhost:3000/login")
    juzernejm = "Quality Assurance" + string
    
    #username
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[1]//input")
    dugme_input.send_keys(juzernejm)
    #password
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[2]//input")
    dugme_input.send_keys("Quality Assurance")

    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//button")
    dugme_input.click()
    time.sleep(3)

    sadrzaj_polje = driver.find_element(By.XPATH, "//div[@class='user-chip']//div")
    sadrzaj_sadrzaj_polja = sadrzaj_polje.text

    time.sleep(3)

    dugme_kreacije = driver.find_element(By.XPATH, "//body//div//div//header//div//div//nav//a[3]")
    dugme_kreacije.click()
    time.sleep(3)

    dugme_input1 = driver.find_element(By.XPATH, "//input[@placeholder='Untitled Form']")
    dugme_input1.send_keys("Test Forma 1")
    
    dugme_input2 = driver.find_element(By.XPATH, "//textarea[@placeholder='Add a description']")
    dugme_input2.send_keys("Test Forma 1")

    dugme_kreacija3 = driver.find_element(By.XPATH, "//button[normalize-space(text())='Create Form']")
    dugme_kreacija3.click()
    
    time.sleep(1.5)

    alert = driver.switch_to.alert
    alert.accept()

    time.sleep(1.5)

    searchbar = driver.find_element(By.XPATH, "//body//div//div//header//div//form//input")
    searchbar.send_keys("Test")
    searchbar.send_keys(Keys.ENTER)

    time.sleep(3)

    #sama pretraga
    glavnielement = driver.find_element(By.XPATH, "//main//div")
    brojdivova = glavnielement.find_elements(By.XPATH, "./div")

    #searchbar.send_keys(str(len(brojdivova)))
    #print(str(len(brojdivova)))
    time.sleep(2)

    pravibrojdivova = len(brojdivova)
    postoji = False
    for i in range(pravibrojdivova):
        xpath = "//div["+str(i+1)+"]//div[1]//h5"
        elemntobrad = glavnielement.find_element(By.XPATH, xpath)
        sadrzaj = str(elemntobrad.text)
        if sadrzaj == "Test Forma 1":
            postoji = True
            break
    assert postoji == True