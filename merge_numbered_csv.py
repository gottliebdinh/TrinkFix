#!/usr/bin/env python3
"""
Script zum Zusammenführen von CSV-Dateien, die mit einem Namen beginnen und mit einer Zahl enden
(z.B. Bier1.csv, Bier2.csv -> Bier_merged.csv)
"""
import csv
import re
from pathlib import Path
from collections import defaultdict

def get_base_name(filename):
    """Extrahiert den Basisnamen aus einem Dateinamen mit Zahl am Ende"""
    # Entferne .csv Endung
    name = filename.replace('.csv', '')
    # Finde das letzte Vorkommen einer Zahl am Ende
    match = re.match(r'^(.+?)(\d+)$', name)
    if match:
        return match.group(1)
    return None

def merge_numbered_csvs():
    data_dir = Path('data')
    
    # Finde alle CSV-Dateien (außer allData_merged.csv und unmatched_items.csv)
    csv_files = [
        f for f in data_dir.glob('*.csv')
        if f.name not in ['allData_merged.csv', 'unmatched_items.csv']
    ]
    
    # Gruppiere Dateien nach Basisnamen
    grouped = defaultdict(list)
    for csv_file in csv_files:
        base_name = get_base_name(csv_file.name)
        if base_name:
            grouped[base_name].append(csv_file)
        else:
            # Dateien ohne Zahl am Ende werden ignoriert
            print(f"Überspringe {csv_file.name} (keine Zahl am Ende)")
    
    if not grouped:
        print("Keine Dateien mit Zahlen am Ende gefunden!")
        return
    
    print(f"Gefundene Gruppen: {len(grouped)}")
    print("="*60)
    
    # Verarbeite jede Gruppe
    for base_name, files in sorted(grouped.items()):
        if len(files) < 2:
            print(f"\n{base_name}: Nur 1 Datei gefunden, überspringe")
            continue
        
        # Sortiere Dateien nach Zahl
        files.sort(key=lambda f: int(re.search(r'(\d+)\.csv$', f.name).group(1)))
        
        print(f"\n📁 {base_name}: {len(files)} Dateien")
        for f in files:
            print(f"   - {f.name}")
        
        # Lese Header aus der ersten Datei
        header = None
        total_rows = 0
        output_file = data_dir / f"{base_name}_merged.csv"
        
        with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
            writer = None
            
            for csv_file in files:
                print(f"   Verarbeite: {csv_file.name}")
                
                with open(csv_file, 'r', encoding='utf-8') as infile:
                    reader = csv.DictReader(infile)
                    
                    # Header lesen
                    file_header = list(reader.fieldnames)
                    
                    # Header für Output-Datei setzen (nur beim ersten Mal)
                    if header is None:
                        header = file_header
                        writer = csv.DictWriter(outfile, fieldnames=header)
                        writer.writeheader()
                    else:
                        # Prüfe ob Header übereinstimmen
                        if file_header != header:
                            print(f"      ⚠️  Warnung: Header in {csv_file.name} stimmt nicht überein!")
                            # Versuche trotzdem zu schreiben, fehlende Spalten werden leer sein
                    
                    # Alle Zeilen schreiben
                    file_rows = 0
                    for row in reader:
                        # Stelle sicher, dass alle Spalten vorhanden sind
                        complete_row = {col: row.get(col, '') for col in header}
                        writer.writerow(complete_row)
                        file_rows += 1
                        total_rows += 1
                    
                    print(f"      -> {file_rows} Zeilen hinzugefügt")
        
        print(f"   ✅ Gespeichert: {output_file.name} ({total_rows} Zeilen gesamt)")
    
    print("\n" + "="*60)
    print("✅ Fertig!")

if __name__ == '__main__':
    merge_numbered_csvs()

