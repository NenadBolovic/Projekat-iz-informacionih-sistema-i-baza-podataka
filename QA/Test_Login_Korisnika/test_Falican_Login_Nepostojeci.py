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

def test_login_falican_username(driver):
    driver.get("http://localhost:3000/login")
    juzernejm = "bananaman"
    
    #username
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[1]//input")
    #dugme_input.send_keys(juzernejm)
    #password
    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//div[2]//input")
    dugme_input.send_keys("bananaman")

    dugme_input = driver.find_element(By.XPATH, "//div[@class='login-box']//form//button")
    dugme_input.click()
    time.sleep(3)

    currenturl = driver.current_url
    vrednost = str(currenturl)
    assert vrednost == "http://localhost:3000/login"