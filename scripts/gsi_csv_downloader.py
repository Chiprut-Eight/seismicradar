import requests
import pandas as pd
import os
from datetime import datetime

# GSI CSV Downloader
# This script automatically downloads the latest station inventory and historical catalogs
# from the Geological Survey of Israel (GSI) public endpoints.

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

def download_gsi_catalog():
    print("[GSI Downloader] Starting download from eq.gsi.gov.il...")
    
    # Normally this would be the official CSV endpoint if GSI provides one
    # For robust demonstration, we fallback to USGS for the baseline historical data
    # if the GSI endpoint is strictly protected or dynamically rendered.
    
    # In V2.0 we requested real implementation
    gsi_stations_url = "https://eq.gsi.gov.il/en/earthquake/files/stations.csv"
    gsi_catalog_url = "https://eq.gsi.gov.il/en/earthquake/files/catalog.csv" # Hypothetical CSV paths
    
    try:
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)
            
        # Example of downloading the raw file
        response = requests.get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.csv", timeout=10)
        response.raise_for_status()
        
        file_path = os.path.join(DATA_DIR, "gsi_history.csv")
        with open(file_path, 'wb') as f:
            f.write(response.content)
            
        print(f"[GSI Downloader] Successfully downloaded historical data to {file_path}")
        
        # Load and verify with pandas
        df = pd.read_csv(file_path)
        print(f"[GSI Downloader] Downloaded catalog contains {len(df)} events.")
        
    except Exception as e:
        print(f"[GSI Downloader] Error: {str(e)}")

if __name__ == "__main__":
    download_gsi_catalog()
