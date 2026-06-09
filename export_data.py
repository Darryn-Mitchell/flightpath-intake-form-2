#!/usr/bin/env python3
"""
Export FlightPath form data to CSV files
Run this to convert JSON storage to CSV for easy viewing/import
"""

import json
import csv
from pathlib import Path
from datetime import datetime

DATA_DIR = Path(__file__).parent / "data"
EXPORT_DIR = Path(__file__).parent / "exports"

def export_to_csv(json_file):
    """Convert a JSON data file to CSV"""
    EXPORT_DIR.mkdir(exist_ok=True)

    with open(json_file, 'r') as f:
        data = json.load(f)

    if not data:
        print(f"No data in {json_file.name}")
        return

    # Generate CSV filename
    csv_file = EXPORT_DIR / f"{json_file.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    # Get all unique keys from all entries
    all_keys = set()
    for entry in data:
        all_keys.update(entry.keys())

    fieldnames = sorted(all_keys)

    # Write CSV
    with open(csv_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

    print(f"✅ Exported {len(data)} entries to {csv_file}")
    return csv_file

def main():
    """Export all JSON files to CSV"""
    if not DATA_DIR.exists():
        print("No data directory found. No submissions yet.")
        return

    json_files = list(DATA_DIR.glob("*.json"))

    if not json_files:
        print("No data files found. No submissions yet.")
        return

    print(f"Found {len(json_files)} data file(s)\n")

    for json_file in json_files:
        export_to_csv(json_file)

    print(f"\n📁 All exports saved to: {EXPORT_DIR.absolute()}")

if __name__ == "__main__":
    main()
