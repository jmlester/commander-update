// ICAO airfield database for coordinate lookup
// Covers CNAFR AOR, US military/reserve bases, NATO allies, and major international hubs
var ICAO_DB = {

  // ── US Navy / Marine Corps / Reserve ──────────────────────────────────────
  'KNGU': { name: 'NS Norfolk',              lat:  36.9376, lon:  -76.2893 },
  'KNGP': { name: 'NAS Corpus Christi',      lat:  27.6926, lon:  -97.2907 },
  'KNJK': { name: 'NAF El Centro',           lat:  32.8292, lon: -115.6719 },
  'KNPA': { name: 'NAS Pensacola',           lat:  30.3527, lon:  -87.3187 },
  'KJAX': { name: 'NAS Jacksonville',        lat:  30.2358, lon:  -81.6807 },
  'KWRI': { name: 'JB McGuire-Dix-Lakehurst',lat:  40.0156, lon:  -74.5936 },
  'KNZY': { name: 'NAS North Island',        lat:  32.6998, lon: -117.2133 },
  'KNTD': { name: 'NAS Point Mugu',          lat:  34.1203, lon: -119.1210 },
  'KNFL': { name: 'NAS Fallon',              lat:  39.4166, lon: -118.7001 },
  'KNOW': { name: 'NAS Whidbey Island',      lat:  48.3515, lon: -122.6557 },
  'KNSE': { name: 'NAS Whiting Field',       lat:  30.7142, lon:  -87.0219 },
  'KNMM': { name: 'NAS Meridian',            lat:  32.5519, lon:  -88.5556 },
  'KLFI': { name: 'JB Langley-Eustis',       lat:  37.0830, lon:  -76.3609 },
  'KPAM': { name: 'Tyndall AFB',             lat:  30.0696, lon:  -85.5754 },
  'KCOF': { name: 'Patrick SFB',             lat:  28.2349, lon:  -80.6101 },
  'PHNG': { name: 'MCAS Kaneohe Bay',        lat:  21.4505, lon: -157.7685 },
  'PGUM': { name: 'Andersen AFB / Guam Intl',lat:  13.4834, lon:  144.7960 },

  // ── US Air Force ──────────────────────────────────────────────────────────
  'KADW': { name: 'JB Andrews',              lat:  38.8108, lon:  -76.8668 },
  'KBAD': { name: 'Barksdale AFB',           lat:  32.5018, lon:  -93.6627 },
  'KDYS': { name: 'Dyess AFB',               lat:  32.4208, lon:  -99.8546 },
  'KFFO': { name: 'Wright-Patterson AFB',    lat:  39.8261, lon:  -84.0483 },
  'KOFF': { name: 'Offutt AFB',              lat:  41.1183, lon:  -95.9124 },
  'KBGR': { name: 'Bangor Intl / ANG',       lat:  44.8074, lon:  -68.8282 },
  'KEFD': { name: 'Ellington Field',         lat:  29.6073, lon:  -95.1588 },

  // ── US Civilian Hubs ──────────────────────────────────────────────────────
  'KJFK': { name: 'New York JFK',            lat:  40.6413, lon:  -73.7781 },
  'KEWR': { name: 'Newark Liberty',          lat:  40.6895, lon:  -74.1745 },
  'KBOS': { name: 'Boston Logan',            lat:  42.3656, lon:  -71.0096 },
  'KIAD': { name: 'Washington Dulles',       lat:  38.9531, lon:  -77.4565 },
  'KDCA': { name: 'Reagan National',         lat:  38.8521, lon:  -77.0377 },
  'KPHL': { name: 'Philadelphia Intl',       lat:  39.8729, lon:  -75.2437 },
  'KATL': { name: 'Atlanta Hartsfield',      lat:  33.6407, lon:  -84.4277 },
  'KMIA': { name: 'Miami Intl',              lat:  25.7959, lon:  -80.2870 },
  'KMCO': { name: 'Orlando Intl',            lat:  28.4294, lon:  -81.3089 },
  'KORD': { name: 'Chicago O\'Hare',         lat:  41.9742, lon:  -87.9073 },
  'KDFW': { name: 'Dallas Fort Worth',       lat:  32.8998, lon:  -97.0403 },
  'KIAH': { name: 'Houston Intercontinental',lat:  29.9902, lon:  -95.3368 },
  'KDEN': { name: 'Denver Intl',             lat:  39.8561, lon: -104.6737 },
  'KLAX': { name: 'Los Angeles Intl',        lat:  33.9425, lon: -118.4081 },
  'KSFO': { name: 'San Francisco Intl',      lat:  37.6213, lon: -122.3790 },
  'KSEA': { name: 'Seattle-Tacoma Intl',     lat:  47.4502, lon: -122.3088 },
  'PHNL': { name: 'Honolulu Intl',           lat:  21.3245, lon: -157.9251 },

  // ── Atlantic / Caribbean ──────────────────────────────────────────────────
  'LPLA': { name: 'Lajes AFB / Terceira',    lat:  38.7618, lon:  -27.0908 },
  'TXKF': { name: 'Bermuda LF Wade',         lat:  32.3640, lon:  -64.6788 },
  'TJSJ': { name: 'San Juan Luis Muñoz Marín',lat: 18.4394, lon:  -66.0018 },
  'GCFV': { name: 'Fuerteventura',           lat:  28.4527, lon:  -13.8638 },
  'GCLP': { name: 'Gran Canaria',            lat:  27.9319, lon:  -15.3866 },
  'GCTS': { name: 'Tenerife Sur',            lat:  28.0445, lon:  -16.5725 },

  // ── Portugal / Spain ──────────────────────────────────────────────────────
  'LPPT': { name: 'Lisbon Humberto Delgado', lat:  38.7813, lon:   -9.1359 },
  'LPPR': { name: 'Porto',                   lat:  41.2481, lon:   -8.6814 },
  'LEMD': { name: 'Madrid Barajas',          lat:  40.4936, lon:   -3.5668 },
  'LEBL': { name: 'Barcelona',               lat:  41.2971, lon:    2.0785 },
  'LEPA': { name: 'Palma de Mallorca',       lat:  39.5517, lon:    2.7388 },
  'LEAL': { name: 'Alicante',                lat:  38.2822, lon:   -0.5582 },
  'LEMG': { name: 'Málaga',                  lat:  36.6749, lon:   -4.4991 },
  'LEGR': { name: 'Granada',                 lat:  37.1887, lon:   -3.7775 },
  'LEZL': { name: 'Seville',                 lat:  37.4180, lon:   -5.8931 },
  'LPFA': { name: 'Sintra AB (Portugal)',     lat:  38.8311, lon:   -9.3394 },

  // ── France ────────────────────────────────────────────────────────────────
  'LFPG': { name: 'Paris Charles de Gaulle', lat:  49.0097, lon:    2.5478 },
  'LFPO': { name: 'Paris Orly',              lat:  48.7233, lon:    2.3794 },
  'LFPB': { name: 'Paris Le Bourget',        lat:  48.9694, lon:    2.4414 },
  'LFML': { name: 'Marseille Provence',      lat:  43.4393, lon:    5.2214 },
  'LFMN': { name: 'Nice Côte d\'Azur',       lat:  43.6653, lon:    7.2150 },
  'LFBO': { name: 'Toulouse Blagnac',        lat:  43.6293, lon:    1.3638 },
  'LFLL': { name: 'Lyon Saint-Exupéry',      lat:  45.7256, lon:    5.0811 },
  'LFRN': { name: 'Rennes',                  lat:  48.0695, lon:   -1.7348 },
  'LFRS': { name: 'Nantes Atlantique',       lat:  47.1532, lon:   -1.6107 },
  'LFRB': { name: 'Brest Bretagne',          lat:  48.4479, lon:   -4.4183 },
  'LFBD': { name: 'Bordeaux',                lat:  44.8283, lon:   -0.7156 },

  // ── Ireland ───────────────────────────────────────────────────────────────
  'EINN': { name: 'Shannon',                 lat:  52.7019, lon:   -8.9248 },
  'EIDW': { name: 'Dublin',                  lat:  53.4213, lon:   -6.2701 },
  'EICK': { name: 'Cork',                    lat:  51.8413, lon:   -8.4911 },

  // ── United Kingdom ────────────────────────────────────────────────────────
  'EGLL': { name: 'London Heathrow',         lat:  51.4775, lon:   -0.4614 },
  'EGKK': { name: 'London Gatwick',          lat:  51.1537, lon:   -0.1821 },
  'EGSS': { name: 'London Stansted',         lat:  51.8850, lon:    0.2350 },
  'EGLC': { name: 'London City',             lat:  51.5053, lon:    0.0553 },
  'EGBB': { name: 'Birmingham',              lat:  52.4539, lon:   -1.7480 },
  'EGCC': { name: 'Manchester',              lat:  53.3537, lon:   -2.2750 },
  'EGNT': { name: 'Newcastle',               lat:  55.0375, lon:   -1.6917 },
  'EGNX': { name: 'East Midlands',           lat:  52.8311, lon:   -1.3281 },
  'EGPH': { name: 'Edinburgh',               lat:  55.9500, lon:   -3.3725 },
  'EGPF': { name: 'Glasgow',                 lat:  55.8719, lon:   -4.4331 },
  'EGPD': { name: 'Aberdeen',                lat:  57.2019, lon:   -2.1978 },
  'EGPB': { name: 'Sumburgh (Shetland)',      lat:  59.8789, lon:   -1.2956 },
  'EGAA': { name: 'Belfast International',   lat:  54.6575, lon:   -6.2158 },
  'EGUN': { name: 'RAF Mildenhall',          lat:  52.3619, lon:    0.4864 },
  'EGVN': { name: 'RAF Brize Norton',        lat:  51.7500, lon:   -1.5836 },
  'EGQS': { name: 'RAF Lossiemouth',         lat:  57.7052, lon:   -3.3393 },
  'EGDY': { name: 'RNAS Yeovilton',          lat:  51.0094, lon:   -2.6388 },

  // ── Benelux / Germany / Switzerland / Austria ─────────────────────────────
  'EBBR': { name: 'Brussels',               lat:  50.9014, lon:    4.4844 },
  'EHAM': { name: 'Amsterdam Schiphol',     lat:  52.3086, lon:    4.7639 },
  'EHEH': { name: 'Eindhoven',              lat:  51.4501, lon:    5.3746 },
  'EDDF': { name: 'Frankfurt',              lat:  50.0333, lon:    8.5706 },
  'EDDM': { name: 'Munich',                 lat:  48.3538, lon:   11.7861 },
  'EDDB': { name: 'Berlin Brandenburg',     lat:  52.3667, lon:   13.5033 },
  'ETAD': { name: 'Spangdahlem AB',         lat:  49.9726, lon:    6.6925 },
  'ETAR': { name: 'Ramstein AB',            lat:  49.4369, lon:    7.6003 },
  'LSZH': { name: 'Zurich',                 lat:  47.4647, lon:    8.5492 },
  'LSGG': { name: 'Geneva',                 lat:  46.2380, lon:    6.1090 },
  'LOWW': { name: 'Vienna',                 lat:  48.1103, lon:   16.5697 },

  // ── Scandinavia / Baltic ──────────────────────────────────────────────────
  'EKCH': { name: 'Copenhagen Kastrup',     lat:  55.6180, lon:   12.6560 },
  'EKYT': { name: 'Aalborg',                lat:  57.0928, lon:    9.8492 },
  'ENGM': { name: 'Oslo Gardermoen',        lat:  60.1939, lon:   11.1004 },
  'ESSA': { name: 'Stockholm Arlanda',      lat:  59.6519, lon:   17.9186 },
  'EFHK': { name: 'Helsinki Vantaa',        lat:  60.3172, lon:   24.9633 },
  'EVRA': { name: 'Riga',                   lat:  56.9236, lon:   23.9711 },
  'EYVI': { name: 'Vilnius',                lat:  54.6341, lon:   25.2858 },
  'EETN': { name: 'Tallinn',                lat:  59.4133, lon:   24.8328 },

  // ── Central / Eastern Europe ──────────────────────────────────────────────
  'EPWA': { name: 'Warsaw Chopin',          lat:  52.1657, lon:   20.9671 },
  'EPKK': { name: 'Kraków Balice',          lat:  50.0777, lon:   19.7848 },
  'EPGD': { name: 'Gdańsk Lech Wałęsa',    lat:  54.3776, lon:   18.4662 },
  'EPKT': { name: 'Katowice Pyrzowice',     lat:  50.4743, lon:   19.0800 },
  'LKPR': { name: 'Prague Václav Havel',    lat:  50.1008, lon:   14.2600 },
  'LKMT': { name: 'Ostrava Mošnov',         lat:  49.6963, lon:   18.1111 },
  'LHBP': { name: 'Budapest',               lat:  47.4369, lon:   19.2556 },
  'LROP': { name: 'Bucharest Henri Coandă', lat:  44.5711, lon:   26.0850 },
  'LYBT': { name: 'Belgrade Nikola Tesla',  lat:  44.8184, lon:   20.3091 },
  'LDZA': { name: 'Zagreb',                 lat:  45.7429, lon:   16.0688 },
  'LJLJ': { name: 'Ljubljana Jože Pučnik',  lat:  46.2237, lon:   14.4576 },
  'LBSF': { name: 'Sofia',                  lat:  42.6967, lon:   23.4067 },
  'LBBG': { name: 'Burgas',                 lat:  42.5680, lon:   27.5151 },
  'LUKK': { name: 'Chișinău',               lat:  46.9277, lon:   28.9313 },
  'UKLL': { name: 'Lviv Danylo Halytskyi',  lat:  49.8125, lon:   23.9561 },
  'UKBB': { name: 'Kyiv Boryspil',          lat:  50.3450, lon:   30.8947 },
  'UKKK': { name: 'Kyiv Zhuliany (Sikorsky)',lat: 50.4017, lon:   30.4494 },

  // ── Italy ─────────────────────────────────────────────────────────────────
  'LIRF': { name: 'Rome Fiumicino',          lat:  41.8003, lon:   12.2389 },
  'LIRA': { name: 'Rome Ciampino',           lat:  41.7994, lon:   12.5949 },
  'LIME': { name: 'Bergamo Orio al Serio',   lat:  45.6739, lon:    9.7042 },
  'LIMC': { name: 'Milan Malpensa',          lat:  45.6306, lon:    8.7228 },
  'LIML': { name: 'Milan Linate',            lat:  45.4454, lon:    9.2774 },
  'LIPZ': { name: 'Venice Marco Polo',       lat:  45.5053, lon:   12.3519 },
  'LIPE': { name: 'Bologna Guglielmo Marconi',lat: 44.5353, lon:   11.2887 },
  'LIRP': { name: 'Pisa Galileo Galilei',    lat:  43.6839, lon:   10.3927 },
  'LIBD': { name: 'Bari Karol Wojtyla',      lat:  41.1389, lon:   16.7606 },
  'LIRN': { name: 'Naples Capodichino',      lat:  40.8840, lon:   14.2908 },
  'LIPA': { name: 'Aviano AB',               lat:  46.0319, lon:   12.5965 },
  'LICZ': { name: 'NAS Sigonella',           lat:  37.4017, lon:   14.9224 },
  'LICJ': { name: 'Palermo Punta Raisi',     lat:  38.1796, lon:   13.0910 },
  'LICC': { name: 'Catania Fontanarossa',    lat:  37.4668, lon:   15.0664 },

  // ── Greece / Cyprus / Turkey ──────────────────────────────────────────────
  'LGAV': { name: 'Athens Eleftherios Venizelos', lat: 37.9364, lon: 23.9445 },
  'LGTS': { name: 'Thessaloniki',            lat:  40.5197, lon:   22.9709 },
  'LCLK': { name: 'Larnaca Intl',            lat:  34.8751, lon:   33.6249 },
  'LCRA': { name: 'RAF Akrotiri',            lat:  34.5905, lon:   32.9879 },
  'LTAG': { name: 'Incirlik AB',             lat:  37.0021, lon:   35.4259 },
  'LTAF': { name: 'Adana Sakirpasa',         lat:  36.9822, lon:   35.2800 },
  'LTBA': { name: 'Istanbul Atatürk',        lat:  40.9769, lon:   28.8146 },
  'LTFM': { name: 'Istanbul Airport',        lat:  41.2753, lon:   28.7519 },
  'LTAI': { name: 'Antalya',                 lat:  36.8987, lon:   30.8005 },

  // ── North Africa ──────────────────────────────────────────────────────────
  'GMMN': { name: 'Casablanca Mohammed V',   lat:  33.3675, lon:   -7.5899 },
  'DAAG': { name: 'Algiers Houari Boumediene',lat: 36.6910, lon:    3.2154 },
  'DTTA': { name: 'Tunis Carthage',           lat: 36.8510, lon:   10.2272 },
  'HLLT': { name: 'Tripoli Intl',             lat: 32.6635, lon:   13.1590 },
  'HECA': { name: 'Cairo Intl',               lat: 30.1219, lon:   31.4056 },
  'HEMM': { name: 'Mersa Matruh',             lat: 31.3254, lon:   27.2216 },
  'HSSS': { name: 'Khartoum',                 lat: 15.5895, lon:   32.5532 },

  // ── Middle East ───────────────────────────────────────────────────────────
  'LLBG': { name: 'Tel Aviv Ben Gurion',     lat:  32.0114, lon:   34.8867 },
  'OJAM': { name: 'Amman Queen Alia',        lat:  31.7226, lon:   35.9932 },
  'OLBA': { name: 'Beirut Rafic Hariri',     lat:  33.8209, lon:   35.4884 },
  'OSDI': { name: 'Damascus Intl',           lat:  33.4114, lon:   36.5156 },
  'ORBI': { name: 'Baghdad Intl',            lat:  33.2625, lon:   44.2346 },
  'ORMM': { name: 'Basra Intl',              lat:  30.5491, lon:   47.6621 },
  'OKBK': { name: 'Kuwait Intl',             lat:  29.2266, lon:   47.9689 },
  'OBBI': { name: 'Bahrain Intl',            lat:  26.2708, lon:   50.6336 },
  'OEDF': { name: 'Dammam King Fahd',        lat:  26.4712, lon:   49.7979 },
  'OERK': { name: 'Riyadh King Khalid',      lat:  24.9576, lon:   46.6988 },
  'OEJN': { name: 'Jeddah King Abdulaziz',   lat:  21.6796, lon:   39.1565 },
  'OYSN': { name: 'Sana\'a Intl',            lat:  15.4763, lon:   44.2197 },
  'OTBH': { name: 'Al Udeid AB',             lat:  25.1174, lon:   51.3150 },
  'OMAA': { name: 'Abu Dhabi Intl',          lat:  24.4330, lon:   54.6511 },
  'OMDB': { name: 'Dubai Intl',              lat:  25.2528, lon:   55.3644 },
  'OMSJ': { name: 'Sharjah Intl',            lat:  25.3286, lon:   55.5172 },
  'OMFJ': { name: 'Fujairah Intl',           lat:  25.1122, lon:   56.3240 },

  // ── East Africa / Horn ────────────────────────────────────────────────────
  'HDAM': { name: 'Djibouti Ambouli',        lat:  11.5473, lon:   43.1595 },
  'HCMM': { name: 'Mogadishu Aden Adde',     lat:   2.0144, lon:   45.3047 },
  'HAAB': { name: 'Addis Ababa Bole',        lat:   8.9779, lon:   38.7993 },
  'HKJK': { name: 'Nairobi Jomo Kenyatta',   lat:  -1.3192, lon:   36.9275 },
  'HTDA': { name: 'Dar es Salaam Julius Nyerere', lat: -6.8781, lon: 39.2026 },

  // ── West Africa ───────────────────────────────────────────────────────────
  'GOOY': { name: 'Dakar Léopold Sédar Senghor', lat: 14.7397, lon: -17.4902 },
  'GBYD': { name: 'Banjul Yundum',           lat:  13.3380, lon:  -16.6522 },
  'GUCY': { name: 'Conakry Gbessia',         lat:   9.5769, lon:  -13.6119 },
  'DIAP': { name: 'Abidjan Félix-Houphouët-Boigny', lat: 5.2613, lon: -3.9263 },
  'DRRN': { name: 'Niamey Diori Hamani',     lat:  13.4815, lon:    2.1836 },

  // ── Southern Africa ───────────────────────────────────────────────────────
  'FNLU': { name: 'Luanda Quatro de Fevereiro', lat: -8.8587, lon: 13.2312 },
  'FAJS': { name: 'Johannesburg OR Tambo',   lat: -26.1392, lon:   28.2460 },
  'FACT': { name: 'Cape Town Intl',          lat: -33.9649, lon:   18.6017 },

  // ── Indian Ocean ──────────────────────────────────────────────────────────
  'FJDG': { name: 'Diego Garcia (BIOT)',     lat:  -7.3132, lon:   72.4113 },
  'FSIA': { name: 'Mahé / Seychelles Intl',  lat:  -4.6743, lon:   55.5218 },
  'FIMP': { name: 'Mauritius Sir Seewoosagur', lat: -20.4302, lon: 57.6836 },

  // ── South / Southeast Asia ────────────────────────────────────────────────
  'VABB': { name: 'Mumbai Chhatrapati Shivaji', lat: 19.0896, lon: 72.8656 },
  'VIDP': { name: 'Delhi Indira Gandhi',     lat:  28.5562, lon:   77.1000 },
  'VOBL': { name: 'Bengaluru Kempegowda',    lat:  12.9499, lon:   77.6680 },
  'VOCI': { name: 'Kochi Intl',              lat:  10.1522, lon:   76.4016 },
  'WSSS': { name: 'Singapore Changi',        lat:   1.3502, lon:  103.9943 },
  'VHHH': { name: 'Hong Kong Intl',          lat:  22.3089, lon:  113.9145 },

  // ── Pacific / Northeast Asia ──────────────────────────────────────────────
  'RJTY': { name: 'Yokota AB',               lat:  35.7485, lon:  139.3487 },
  'RJTT': { name: 'Tokyo Haneda',            lat:  35.5494, lon:  139.7798 },
  'RJAA': { name: 'Tokyo Narita',            lat:  35.7647, lon:  140.3864 },
  'RKSI': { name: 'Seoul Incheon',           lat:  37.4691, lon:  126.4509 },
  'RCTP': { name: 'Taipei Taoyuan',          lat:  25.0777, lon:  121.2330 },
  'YBBN': { name: 'Brisbane Intl',           lat: -27.3842, lon:  153.1175 },
  'YSSY': { name: 'Sydney Kingsford Smith',  lat: -33.9461, lon:  151.1772 },
};

function lookupICAO(code) {
  if (!code) return null;
  return ICAO_DB[code.toUpperCase().trim()] || null;
}
