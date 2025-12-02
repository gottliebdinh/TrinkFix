#!/usr/bin/env python3
"""
Script zum Zusammenführen aller CSV-Dateien aus data/allData/
"""
import csv
import os
from pathlib import Path

def merge_csv_files():
    # Pfad zum allData Verzeichnis
    data_dir = Path('data/allData')
    output_file = Path('data/allData_merged.csv')
    
    # Alle CSV-Dateien finden und sortieren
    csv_files = sorted(data_dir.glob('produkte*.csv'))
    
    if not csv_files:
        print("Keine CSV-Dateien gefunden!")
        return
    
    print(f"Gefundene CSV-Dateien: {len(csv_files)}")
    
    # Header aus der ersten Datei lesen
    header = None
    total_rows = 0
    
    # Output-Datei öffnen
    with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = None
        
        for csv_file in csv_files:
            print(f"Verarbeite: {csv_file.name}")
            
            with open(csv_file, 'r', encoding='utf-8') as infile:
                # CSV Reader mit Semikolon als Delimiter
                reader = csv.reader(infile, delimiter=';')
                
                # Header lesen
                file_header = next(reader)
                
                # Header für Output-Datei setzen (nur beim ersten Mal)
                if header is None:
                    header = file_header
                    writer = csv.writer(outfile, delimiter=';')
                    writer.writerow(header)
                else:
                    # Prüfen ob Header übereinstimmen
                    if file_header != header:
                        print(f"Warnung: Header in {csv_file.name} stimmt nicht überein!")
                
                # Alle Zeilen schreiben
                file_rows = 0
                for row in reader:
                    writer.writerow(row)
                    file_rows += 1
                    total_rows += 1
                
                print(f"  -> {file_rows} Zeilen hinzugefügt")
    
    print(f"\n✅ Erfolgreich zusammengeführt!")
    print(f"   Gesamt: {total_rows} Zeilen")
    print(f"   Output: {output_file}")

if __name__ == '__main__':
    merge_csv_files()

