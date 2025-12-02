#!/usr/bin/env python3
"""
Konvertiert alle CSV-Dateien zu JSON für die React Native App
"""
import csv
import json
from pathlib import Path

def convert_csv_to_json(csv_file, output_dir):
    """Konvertiert eine CSV-Datei zu JSON"""
    products = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            products.append(dict(row))
    
    # Erstelle JSON-Datei
    json_file = output_dir / f"{csv_file.stem}.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    return len(products)

def main():
    data_dir = Path('data')
    output_dir = Path('data/json')
    output_dir.mkdir(exist_ok=True)
    
    # Finde alle CSV-Dateien (außer allData_merged.csv und unmatched_items.csv)
    csv_files = [
        f for f in data_dir.glob('*.csv')
        if f.name not in ['allData_merged.csv', 'unmatched_items.csv']
        and not f.name.startswith('produkte')
        and not f.name.endswith('1.csv')
        and not f.name.endswith('2.csv')
        and not f.name.endswith('3.csv')
        and not f.name.endswith('4.csv')
    ]
    
    # Füge die merged Dateien hinzu
    merged_files = [
        data_dir / 'Bier_merged.csv',
        data_dir / 'Cola_merged.csv',
        data_dir / 'Wein_merged.csv',
    ]
    
    csv_files.extend([f for f in merged_files if f.exists()])
    
    print(f"Konvertiere {len(csv_files)} CSV-Dateien zu JSON...")
    print("="*60)
    
    total_products = 0
    
    for csv_file in sorted(csv_files):
        count = convert_csv_to_json(csv_file, output_dir)
        total_products += count
        print(f"✅ {csv_file.name} -> {csv_file.stem}.json ({count} Produkte)")
    
    print("="*60)
    print(f"✅ Fertig! {total_products} Produkte in {len(csv_files)} JSON-Dateien")

if __name__ == '__main__':
    main()

