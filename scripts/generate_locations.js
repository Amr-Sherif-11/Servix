// scripts/generate_locations.js
const { Country, State, City } = require('country-state-city');
const fs = require('fs');
const path = require('path');

const out = { countries: {}, states: {}, cities: {} };

// Populate countries
Country.getAllCountries().forEach(c => {
  out.countries[c.isoCode] = c.name;
  out.states[c.isoCode] = {};
  out.cities[c.isoCode] = {};
});

// Populate states per country
Object.keys(out.countries).forEach(iso => {
  const states = State.getStatesOfCountry(iso);
  states.forEach(s => {
    out.states[iso][s.isoCode] = s.name;
    out.cities[iso][s.isoCode] = [];
  });
});

// Populate cities per state
Object.entries(out.cities).forEach(([iso, stateMap]) => {
  Object.keys(stateMap).forEach(stateIso => {
    const cityList = City.getCitiesOfState(iso, stateIso);
    out.cities[iso][stateIso] = cityList.map(c => c.name);
  });
});

const dest = path.join(__dirname, '..', 'src', 'i18n', 'locations', 'en.json');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf-8');
console.log('Location data written to', dest);
