#!/usr/bin/env python3
"""
Script zum Anreichern aller CSV-Dateien unter data/ mit Informationen aus allData_merged.csv
"""
import csv
import os
from pathlib import Path
from collections import defaultdict

def normalize_name(name):
    """Normalisiert einen Namen für den Vergleich (entfernt Anführungszeichen, normalisiert Leerzeichen)"""
    if not name:
        return ""
    # Entferne Anführungszeichen
    name = name.strip().strip('"').strip("'")
    # Normalisiere Leerzeichen
    name = " ".join(name.split())
    return name.lower()

def load_all_data():
    """Lädt allData_merged.csv und erstellt ein Dictionary für schnelles Lookup"""
    all_data_file = Path('data/allData_merged.csv')
    lookup = {}
    
    print(f"Lade {all_data_file}...")
    
    with open(all_data_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            # Erstelle Lookup basierend auf name und title_attribute
            name = normalize_name(row.get('name', ''))
            title = normalize_name(row.get('title_attribute', ''))
            
            # Speichere für beide Varianten
            if name:
                if name not in lookup:
                    lookup[name] = []
                lookup[name].append(row)
            
            if title and title != name:
                if title not in lookup:
                    lookup[title] = []
                lookup[title].append(row)
    
    print(f"  -> {len(lookup)} eindeutige Namen geladen")
    return lookup

def enrich_csv_file(csv_file, all_data_lookup):
    """Reichert eine einzelne CSV-Datei mit Daten aus allData an"""
    print(f"\nVerarbeite: {csv_file.name}")
    
    # Lese die ursprüngliche CSV
    rows = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"  -> {len(rows)} Zeilen gefunden")
    
    # Neue Spalten aus allData
    new_columns = [
        'data_id', 'data_productid', 'data_index', 'title_attribute', 
        'ref', 'unit_title', 'unit_value', 'unit_label', 'tags', 
        'volume_raw', 'volume_liters'
    ]
    
    # Erweitere jede Zeile
    enriched_rows = []
    matched_count = 0
    unmatched_count = 0
    
    for row in rows:
        artikelname = normalize_name(row.get('Artikelname', ''))
        
        # Suche in allData
        matched_data = None
        if artikelname in all_data_lookup:
            # Nimm den ersten Match (oder den mit passendem BildURL)
            matches = all_data_lookup[artikelname]
            
            # Wenn BildURL vorhanden, versuche exakten Match
            bild_url = row.get('BildURL', '').strip()
            if bild_url:
                for match in matches:
                    if match.get('image_url', '').strip() == bild_url:
                        matched_data = match
                        break
            
            # Falls kein exakter Match, nimm den ersten
            if not matched_data and matches:
                matched_data = matches[0]
        
        # Erweitere die Zeile
        enriched_row = row.copy()
        
        if matched_data:
            # Füge alle zusätzlichen Spalten hinzu
            for col in new_columns:
                enriched_row[col] = matched_data.get(col, '')
            matched_count += 1
        else:
            # Leere Werte für nicht gematchte Zeilen
            for col in new_columns:
                enriched_row[col] = ''
            unmatched_count += 1
        
        enriched_rows.append(enriched_row)
    
    print(f"  -> {matched_count} Zeilen gematcht, {unmatched_count} nicht gematcht")
    
    # Schreibe die erweiterte CSV
    if enriched_rows:
        output_file = csv_file  # Überschreibe die ursprüngliche Datei
        fieldnames = list(enriched_rows[0].keys())
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(enriched_rows)
        
        print(f"  -> ✅ Gespeichert: {output_file.name}")
        return matched_count, unmatched_count
    
    return 0, 0

def main():
    data_dir = Path('data')
    all_data_file = Path('data/allData_merged.csv')
    
    if not all_data_file.exists():
        print(f"Fehler: {all_data_file} nicht gefunden!")
        return
    
    # Lade allData
    all_data_lookup = load_all_data()
    
    # Finde alle CSV-Dateien unter data/ (außer allData/ und allData_merged.csv)
    csv_files = [
        f for f in data_dir.glob('*.csv')
        if f.name != 'allData_merged.csv'
    ]
    
    # Sortiere für konsistente Verarbeitung
    csv_files.sort()
    
    if not csv_files:
        print("Keine CSV-Dateien zum Anreichern gefunden!")
        return
    
    print(f"\nGefundene CSV-Dateien zum Anreichern: {len(csv_files)}")
    
    total_matched = 0
    total_unmatched = 0
    
    # Verarbeite jede CSV-Datei
    for csv_file in csv_files:
        matched, unmatched = enrich_csv_file(csv_file, all_data_lookup)
        total_matched += matched
        total_unmatched += unmatched
    
    print(f"\n{'='*60}")
    print(f"✅ Fertig!")
    print(f"   Gesamt gematcht: {total_matched}")
    print(f"   Gesamt nicht gematcht: {total_unmatched}")
    print(f"   Erfolgsrate: {total_matched/(total_matched+total_unmatched)*100:.1f}%" if (total_matched+total_unmatched) > 0 else "   Erfolgsrate: 0%")

if __name__ == '__main__':
    main()

