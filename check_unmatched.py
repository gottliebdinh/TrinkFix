#!/usr/bin/env python3
"""
Script zum Identifizieren der nicht gematchten Zeilen
"""
import csv
from pathlib import Path

def normalize_name(name):
    """Normalisiert einen Namen für den Vergleich"""
    if not name:
        return ""
    name = name.strip().strip('"').strip("'")
    name = " ".join(name.split())
    return name.lower()

def load_all_data():
    """Lädt allData_merged.csv und erstellt ein Dictionary für schnelles Lookup"""
    all_data_file = Path('data/allData_merged.csv')
    lookup = {}
    
    with open(all_data_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            name = normalize_name(row.get('name', ''))
            title = normalize_name(row.get('title_attribute', ''))
            
            if name:
                if name not in lookup:
                    lookup[name] = []
                lookup[name].append(row)
            
            if title and title != name:
                if title not in lookup:
                    lookup[title] = []
                lookup[title].append(row)
    
    return lookup

def find_unmatched(csv_file, all_data_lookup):
    """Findet nicht gematchte Zeilen in einer CSV-Datei"""
    unmatched = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            artikelname = normalize_name(row.get('Artikelname', ''))
            
            # Prüfe ob gematcht wurde (hat data_id)
            if not row.get('data_id', '').strip():
                unmatched.append({
                    'artikelname': row.get('Artikelname', ''),
                    'bildurl': row.get('BildURL', ''),
                    'normalized_name': artikelname
                })
    
    return unmatched

def main():
    data_dir = Path('data')
    all_data_lookup = load_all_data()
    
    # Finde alle CSV-Dateien unter data/ (außer allData/ und allData_merged.csv)
    csv_files = [
        f for f in data_dir.glob('*.csv')
        if f.name != 'allData_merged.csv'
    ]
    
    csv_files.sort()
    
    print("="*80)
    print("NICHT GEMMATCHTE ZEILEN NACH DATEI")
    print("="*80)
    
    total_unmatched = 0
    
    for csv_file in csv_files:
        unmatched = find_unmatched(csv_file, all_data_lookup)
        
        if unmatched:
            total_unmatched += len(unmatched)
            print(f"\n📄 {csv_file.name} ({len(unmatched)} nicht gematcht):")
            print("-" * 80)
            
            for item in unmatched:
                print(f"  • {item['artikelname']}")
                if item['bildurl']:
                    print(f"    BildURL: {item['bildurl']}")
                
                # Versuche ähnliche Namen zu finden
                normalized = item['normalized_name']
                similar = []
                for key in all_data_lookup.keys():
                    if normalized in key or key in normalized:
                        similar.append(key)
                        if len(similar) >= 3:
                            break
                
                if similar:
                    print(f"    Ähnliche Namen in allData:")
                    for sim in similar[:3]:
                        print(f"      - {sim}")
                print()
    
    print("="*80)
    print(f"GESAMT: {total_unmatched} nicht gematchte Zeilen")
    print("="*80)
    
    # Erstelle auch eine CSV mit allen nicht gematchten Zeilen
    output_file = Path('data/unmatched_items.csv')
    all_unmatched = []
    
    for csv_file in csv_files:
        unmatched = find_unmatched(csv_file, all_data_lookup)
        for item in unmatched:
            item['source_file'] = csv_file.name
            all_unmatched.append(item)
    
    if all_unmatched:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['source_file', 'artikelname', 'bildurl', 'normalized_name']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_unmatched)
        
        print(f"\n✅ Alle nicht gematchten Zeilen wurden in {output_file} gespeichert")

if __name__ == '__main__':
    main()

