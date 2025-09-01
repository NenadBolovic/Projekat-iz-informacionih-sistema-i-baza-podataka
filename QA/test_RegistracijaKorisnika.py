from time import sleep
import pytest
from selenium import webdriver
from selenium.webdriver import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

class test_registracija:
    driver = None
    def setup_method(self):
        service = Service(executable_path="chromedriver.exe")
        self.driver = webdriver.Chrome(service=service)
        time.sleep(10)
        self.driver.get("https://google.com")
        korisnikikonica = self.driver.find_element(By.XPATH, 
            "//svg[@class='MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiAvatar-fallback css-1mo2pzk-MuiSvgIcon-root-MuiAvatar-fallback']")
        korisnikikonica.click()

    def test_registracije(self):
        time.sleep(10)
        dugmeregistracija = self.driver.find_element(By.XPATH, "//a[@class='menu-link']")
        dugmeregistracija.click()
        

    def kraj(self):
        self.driver.quit()