# Car Logos SVG

A curated collection of **47 car manufacturer logos** in SVG format, focused on brands actively sold in the US market. Includes a structured `data.json` file with metadata for each brand.

## Preview

| Brand | Logo | Country | Parent Company |
|-------|------|---------|----------------|
| Acura | <img src="logos/acura.svg" height="40"> | Japan | Honda Motor Company |
| Alfa Romeo | <img src="logos/alfa-romeo.svg" height="40"> | Italy | Stellantis |
| Aston Martin | <img src="logos/aston-martin.svg" height="40"> | UK | Aston Martin Lagonda |
| Audi | <img src="logos/audi.svg" height="40"> | Germany | Volkswagen Group |
| Bentley | <img src="logos/bentley.svg" height="40"> | UK | Volkswagen Group |
| BMW | <img src="logos/bmw.svg" height="40"> | Germany | BMW Group |
| Buick | <img src="logos/buick.svg" height="40"> | USA | General Motors |
| BYD | <img src="logos/byd.svg" height="40"> | China | BYD Company |
| Cadillac | <img src="logos/cadillac.svg" height="40"> | USA | General Motors |
| Chevrolet | <img src="logos/chevrolet.svg" height="40"> | USA | General Motors |
| Chrysler | <img src="logos/chrysler.svg" height="40"> | USA | Stellantis |
| Dodge | <img src="logos/dodge.svg" height="40"> | USA | Stellantis |
| Ferrari | <img src="logos/ferrari.svg" height="40"> | Italy | Ferrari N.V. |
| Fiat | <img src="logos/fiat.svg" height="40"> | Italy | Stellantis |
| Ford | <img src="logos/ford.svg" height="40"> | USA | Ford Motor Company |
| Genesis | <img src="logos/genesis.svg" height="40"> | South Korea | Hyundai Motor Group |
| GMC | <img src="logos/gmc.svg" height="40"> | USA | General Motors |
| Honda | <img src="logos/honda.svg" height="40"> | Japan | Honda Motor Company |
| Hyundai | <img src="logos/hyundai.svg" height="40"> | South Korea | Hyundai Motor Group |
| Infiniti | <img src="logos/infiniti.svg" height="40"> | Japan | Nissan Motor Company |
| Jaguar | <img src="logos/jaguar.svg" height="40"> | UK | Tata Motors (JLR) |
| Jeep | <img src="logos/jeep.svg" height="40"> | USA | Stellantis |
| Kia | <img src="logos/kia.svg" height="40"> | South Korea | Hyundai Motor Group |
| Lamborghini | <img src="logos/lamborghini.svg" height="40"> | Italy | Volkswagen Group |
| Land Rover | <img src="logos/land-rover.svg" height="40"> | UK | Tata Motors (JLR) |
| Lexus | <img src="logos/lexus.svg" height="40"> | Japan | Toyota Motor Corporation |
| Lincoln | <img src="logos/lincoln.svg" height="40"> | USA | Ford Motor Company |
| Lotus | <img src="logos/lotus.svg" height="40"> | UK | Geely |
| Lucid | <img src="logos/lucid.svg" height="40"> | USA | Lucid Group |
| Maserati | <img src="logos/maserati.svg" height="40"> | Italy | Stellantis |
| Mazda | <img src="logos/mazda.svg" height="40"> | Japan | Mazda Motor Corporation |
| McLaren | <img src="logos/mclaren.svg" height="40"> | UK | McLaren Automotive |
| Mercedes-Benz | <img src="logos/mercedes-benz.svg" height="40"> | Germany | Mercedes-Benz Group |
| Mini | <img src="logos/mini.svg" height="40"> | UK | BMW Group |
| Mitsubishi | <img src="logos/mitsubishi.svg" height="40"> | Japan | Nissan-Renault-Mitsubishi Alliance |
| Nissan | <img src="logos/nissan.svg" height="40"> | Japan | Nissan Motor Company |
| Polestar | <img src="logos/polestar.svg" height="40"> | Sweden | Geely / Volvo Cars |
| Porsche | <img src="logos/porsche.svg" height="40"> | Germany | Volkswagen Group |
| Ram | <img src="logos/ram.svg" height="40"> | USA | Stellantis |
| Rivian | <img src="logos/rivian.svg" height="40"> | USA | Rivian Automotive |
| Rolls-Royce | <img src="logos/rolls-royce.svg" height="40"> | UK | BMW Group |
| Subaru | <img src="logos/subaru.svg" height="40"> | Japan | Subaru Corporation |
| Tesla | <img src="logos/tesla.svg" height="40"> | USA | Tesla, Inc. |
| Toyota | <img src="logos/toyota.svg" height="40"> | Japan | Toyota Motor Corporation |
| VinFast | <img src="logos/vinfast.svg" height="40"> | Vietnam | Vingroup |
| Volkswagen | <img src="logos/volkswagen.svg" height="40"> | Germany | Volkswagen Group |
| Volvo | <img src="logos/volvo.svg" height="40"> | Sweden | Geely |

## Structure

```
car-logos-svg/
├── logos/              # SVG logo files (one per brand)
│   ├── acura.svg
│   ├── alfa-romeo.svg
│   ├── audi.svg
│   ├── bmw.svg
│   ├── ...
│   └── volvo.svg
├── data.json           # Structured metadata for all brands
├── package.json        # npm package metadata
├── LICENSE             # MIT License
└── README.md
```

## Data Format

`data.json` contains an array of brand objects:

```json
[
  {
    "name": "Toyota",
    "slug": "toyota",
    "country": "Japan",
    "parent_company": "Toyota Motor Corporation",
    "image": {
      "svg": "./logos/toyota.svg"
    }
  }
]
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name of the brand |
| `slug` | string | URL-safe identifier (used as filename) |
| `country` | string | Country of origin |
| `parent_company` | string | Parent company or corporate group |
| `image.svg` | string | Relative path to the SVG file |

## Usage

### JavaScript / Node.js

```javascript
import brands from './data.json';

// Get all brand names
const names = brands.map(b => b.name);

// Find a specific brand
const toyota = brands.find(b => b.slug === 'toyota');
console.log(toyota.image.svg); // "./logos/toyota.svg"

// Filter by country
const japanese = brands.filter(b => b.country === 'Japan');

// Filter by parent company
const vwGroup = brands.filter(b => b.parent_company === 'Volkswagen Group');
```

### HTML

```html
<img src="logos/toyota.svg" alt="Toyota" height="40">
```

### React

```jsx
import brands from './data.json';

function BrandLogo({ slug }) {
  const brand = brands.find(b => b.slug === slug);
  return <img src={brand.image.svg} alt={brand.name} height={40} />;
}
```

## Coverage

**47 brands** across **10 countries**:

| Country | Count | Brands |
|---------|-------|--------|
| United States | 13 | Buick, Cadillac, Chevrolet, Chrysler, Dodge, Ford, GMC, Jeep, Lincoln, Lucid, Ram, Rivian, Tesla |
| Japan | 9 | Acura, Honda, Infiniti, Lexus, Mazda, Mitsubishi, Nissan, Subaru, Toyota |
| United Kingdom | 8 | Aston Martin, Bentley, Jaguar, Land Rover, Lotus, McLaren, Mini, Rolls-Royce |
| Germany | 5 | Audi, BMW, Mercedes-Benz, Porsche, Volkswagen |
| Italy | 5 | Alfa Romeo, Ferrari, Fiat, Lamborghini, Maserati |
| South Korea | 3 | Genesis, Hyundai, Kia |
| Sweden | 2 | Polestar, Volvo |
| China | 1 | BYD |
| Vietnam | 1 | VinFast |

## Sources

SVG logos sourced from [Wikimedia Commons](https://commons.wikimedia.org/) under their respective licenses. Individual logo trademarks belong to their respective owners.

## License

This repository's code and data structure are released under the [MIT License](LICENSE). The logos themselves are trademarks of their respective companies and are included for identification purposes only.
