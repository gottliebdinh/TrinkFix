export interface Category {
  id: string;
  name: string;
  count: number;
  csvFile: string;
}

export interface Product {
  Artikelname: string;
  BildURL: string;
  unit_title: string;
  unit_value: string;
  volume_liters: string;
  data_id?: string;
  [key: string]: string | undefined;
}

