from selenium import webdriver

driver = webdriver.Chrome()  # Selenium Manager se brine o driveru
driver.get("https://www.google.com")
print(driver.title)
driver.quit()