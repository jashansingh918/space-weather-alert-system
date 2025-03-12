import requests
import time

NOAA_API = "https://services.swpc.noaa.gov/json/solar_probabilities.json"

def fetch_solar_data():
    response = requests.get(NOAA_API)
    if response.status_code == 200:
        data = response.json()
        # Get the most recent forecast (first item in the array)
        latest_forecast = data[0]
        date = latest_forecast["date"]
        
        # Check X-class flare probability for the next 1 day
        x_class_prob = latest_forecast["x_class_1_day"]
        print(f"X-class flare probability (1-day): {x_class_prob}% on {date}")

        # Set a threshold for alerts (e.g., 20% for X-class flares)
        if x_class_prob >= 20:
            alert = {
                "type": "Solar Flare (X-class)",
                "message": f"X-class flare probability: {x_class_prob}% on {date}",
                "timestamp": time.ctime()
            }
            # Send alert to the backend
            try:
                requests.post("http://localhost:5000/alerts", json=alert)
                print("Alert sent to backend:", alert)
            except requests.exceptions.ConnectionError:
                print("Backend not reachable. Ensure server is running on port 5000.")
        
        # Optionally, check proton events (e.g., >10 MeV protons)
        proton_prob = latest_forecast["10mev_protons_1_day"]
        if proton_prob >= 50:  # Threshold for proton event alert
            alert = {
                "type": "Proton Event",
                "message": f"10 MeV proton event probability: {proton_prob}% on {date}",
                "timestamp": time.ctime()
            }
            try:
                requests.post("http://localhost:5000/alerts", json=alert)
                print("Alert sent to backend:", alert)
            except requests.exceptions.ConnectionError:
                print("Backend not reachable.")
        
        return data
    else:
        print(f"Failed to fetch data: HTTP {response.status_code}")
        return None

if __name__ == "__main__":
    while True:
        fetch_solar_data()
        time.sleep(300)  # Check every 5 minutes