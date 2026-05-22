const { City } = require('country-state-city');
const egCities = City.getCitiesOfCountry('EG') || [];
console.log("Total cities in Egypt (EG):", egCities.length);
console.log("Cairo cities:", City.getCitiesOfState('EG', 'C').map(c => c.name));
console.log("Giza cities:", City.getCitiesOfState('EG', 'GZ').map(c => c.name));
