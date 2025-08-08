export const BACKEND_URL= import.meta.env.VITE_BACKEND_URL
export const WEBSOCKET_URL= import.meta.env.VITE_WEBSOCKET_URL

export const STRIPE_PUBLIC_KEY= import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

export const ALL_MAKE: string[]=[
    'Audi',
    'BMW',
    'Lamborghini',
    'Buggati',
    'Volkswagon',
    'Toyota',
    'Jaguar',
    'Ferrari',
]

export const DISTANCES: string[] = [
  'National', 
  'Within 1 miles', 
  'Within 5 miles', 
  'Within 10 miles', 
  'Within 15 miles', 
  'Within 20 miles', 
  'Within 30 miles', 
  'Within 40 miles', 
  'Within 50 miles', 
  'Within 60 miles', 
  'Within 70 miles', 
  'Within 80 miles', 
  'Within 90 miles', 
  'Within 100 miles', 
  'Within 110 miles', 
  'Within 120 miles', 
  'Within 130 miles', 
  'Within 140 miles', 
  'Within 150 miles', 
  'Within 160 miles', 
  'Within 170 miles', 
  'Within 180 miles', 
  'Within 190 miles', 
  'Within 200 miles'
];


export const VEHICLE_CONDITIONS: string[] = [
    'NEW',
    'USED',
    'NEARLY_NEW'
];

export  const MAKE_MODEL_MAP: {[key:string]:string[] }= {
    Audi: [
        'A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ5', 'SQ7', 'SQ8', 'Allroad', 'Cabriolet', 'Coupe', 'Sportback', 'Avant', 'Quattro'
    ],
    BMW: [
        '1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z3', 'Z4', 'Z8', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'i3', 'i4', 'i8', 'iX', 'iX3', 'Gran Coupe', 'Touring', 'Active Tourer', 'Convertible', 'Roadster'
    ],
    Lamborghini: [
        'Aventador', 'Huracan', 'Gallardo', 'Murcielago', 'Urus', 'Diablo', 'Countach', 'Reventon', 'Sian', 'Veneno', 'Centenario', 'Espada', 'Jalpa', 'Miura', 'Islero', 'Jarama', 'LM002', 'Silhouette', '400GT', '350GT', 'Estoque', 'SC18', 'Terzo Millennio'
    ],
    Buggati: [
        'Chiron', 'Veyron', 'Divo', 'Centodieci', 'La Voiture Noire', 'EB110', 'Type 35', 'Type 41 Royale', 'Type 57', 'Bolide', 'Mistral', 'Super Sport', 'Grand Sport', 'Pur Sport', 'Targa', 'Touring', 'Atlantic', 'Galibier'
    ],
    Volkswagon: [
        'Golf', 'Polo', 'Passat', 'Jetta', 'Tiguan', 'Touareg', 'Arteon', 'T-Roc', 'T-Cross', 'ID.3', 'ID.4', 'ID.5', 'ID. Buzz', 'Beetle', 'Scirocco', 'Sharan', 'Touran', 'Caddy', 'Amarok', 'Transporter', 'Multivan', 'Up!', 'Fox', 'Lupo', 'Corrado', 'Bora', 'Eos', 'Phaeton', 'CC', 'Vento', 'Atlas', 'Taos', 'Teramont'
    ],
    Toyota: [
        'Corolla', 'Camry', 'Yaris', 'RAV4', 'Highlander', 'Land Cruiser', 'Hilux', 'Fortuner', 'Innova', 'Prius', 'Supra', 'C-HR', 'Avanza', 'Vios', 'Etios', 'Sienna', 'Tacoma', 'Tundra', '4Runner', 'Sequoia', 'FJ Cruiser', 'Auris', 'Celica', 'MR2', 'Previa', 'Proace', 'Verso', 'Aygo', 'Crown', 'Century', 'Alphard', 'Vellfire', 'GR86', 'bZ4X'
    ],
    Jaguar: [
        'XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type', 'S-Type', 'X-Type', 'XK', 'XKR', 'XJS', 'Mark 2', 'Mark X', 'D-Type', 'C-Type', 'E-Type', 'XJ220', 'XJR', 'XJ6', 'XJ8', 'XJ12', 'Sovereign', 'Daimler', 'XFR', 'XKR-S', 'XFL', 'XEL', 'XJ13'
    ],
    Ferrari: [
        '488', '812', 'F8', 'SF90', 'Roma', 'Portofino', 'GTC4Lusso', 'F12', 'LaFerrari', '458', 'California', '360', '430', 'Enzo', '599', '612', '550', '575M', '456', '348', '328', '308', 'Mondial', 'Testarossa', '512', 'F40', 'F50', 'Dino', 'Superamerica', 'Maranello', 'Scuderia', 'Spider', 'Pista', 'Challenge Stradale', 'GTB', 'GTS', 'Aperta', 'TDF', 'Purosangue'
    ]
};