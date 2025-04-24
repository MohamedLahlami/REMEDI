import requests
from bs4 import BeautifulSoup
import json
import string

BASE_URL = "https://medicament.ma/listing-des-medicaments/page/{page}/?lettre={letter}"
HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

def extract_medications_from_page(soup):
    table = soup.find("table", class_="table")
    if not table:
        return None

    medications = []
    for row in table.tbody.find_all("tr"):
        outer_span = row.find("span", class_="details")
        if not outer_span:
            continue
        inner_span = outer_span.find("span", class_="small")

        name = outer_span.get_text(strip=True, separator="\n").split("\n")[0]
        if inner_span:
            desc_ppv = inner_span.get_text(strip=True)
            if " - PPV: " in desc_ppv:
                description, ppv = desc_ppv.split(" - PPV: ")
            else:
                description, ppv = desc_ppv, ""
        else:
            description, ppv = "", ""

        medications.append({
            "name": name,
            "description": description,
            "ppv": ppv
        })
    return medications

def scrape_all_medications():
    all_data = []

    for letter in string.ascii_uppercase:
        page = 1
        while True:
            print(f"Scraping letter '{letter}', page {page}...")
            url = BASE_URL.format(page=page, letter=letter)
            response = requests.get(url, headers=HEADERS)
            soup = BeautifulSoup(response.content, "html.parser")
            meds = extract_medications_from_page(soup)
            if meds is None:
                print(f"No more data for letter '{letter}'. Moving on.\n")
                break
            all_data.extend(meds)
            print(f"→ Total medications collected so far: {len(all_data)}\n")
            page += 1

    return all_data

if __name__ == "__main__":
    meds = scrape_all_medications()

    with open("medications.json", "w", encoding="utf-8") as f:
        json.dump(meds, f, indent=2, ensure_ascii=False)

    print(f"Finished scraping. Total medications collected: {len(meds)}")
    print("Data written to medications.json")
