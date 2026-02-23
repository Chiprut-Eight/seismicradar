#!/usr/bin/env python3
"""
GSI CSV Downloader stub
Downloads earthquake catalogs from the Geological Survey of Israel.
"""

import os
import json
import time

def download_catalog():
    print("[GSI Downloader] Starting connection to eq.gsi.gov.il...")
    time.sleep(1)
    print("[GSI Downloader] Fetching station inventory...")
    time.sleep(1)
    print("[GSI Downloader] Fetching recent catalog...")
    
    # Simulate saving to data dir
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    output_file = os.path.join(data_dir, 'gsi_history.csv')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("time,latitude,longitude,depth,mag,magType,place\n")
        f.write("2023-11-20T14:30:00Z,31.5,35.2,12.0,3.1,Md,Dead Sea\n")
        f.write("2023-10-15T09:15:00Z,32.8,35.5,8.0,2.5,Md,Sea of Galilee\n")
    
    print(f"[GSI Downloader] Saved mocked historical data to {output_file}")

if __name__ == "__main__":
    download_catalog()
