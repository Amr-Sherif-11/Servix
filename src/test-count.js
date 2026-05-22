const { City } = require('country-state-city');
const allCities = City.getAllCities();
console.log("Total cities in country-state-city package:", allCities.length);
console.log("Some cities:", allCities.slice(0, 10));
