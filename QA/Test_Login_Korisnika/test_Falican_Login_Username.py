import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
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

    assert provera_paragraf_text == "Registration successful! You can now log in."

def test_login_falican_username(driver):
    driver.get("http://localhost:3000/login")
    juzernejm = "Quality Assurance" + string
    
    #username
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[1]//input")
    #dugme_input.send_keys(juzernejm)
    #password
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[2]//input")
    dugme_input.send_keys("Quality Assurance")

    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//button")
    dugme_input.click()
    time.sleep(3)

    currenturl = driver.current_url
    vrednost = str(currenturl)
    assert vrednost == "http://localhost:3000/login"