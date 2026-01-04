export function applyFilters(locations, filters) {
  let filtered = [...locations];
  
  // Origin filter
  if (filters.originalOnly) {
    filtered = filtered.filter(item => item.origin === 'original');
  }
  
  // Category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter(item => filters.categories.includes(item.type));
  }
  
  // Country filter
  if (filters.countries.length > 0) {
    filtered = filtered.filter(item => 
      filters.countries.includes(item.country_english)
    );
  }
  
  return filtered;
}

export function getAvailableCountries(locations) {
  const countries = new Set();
  locations.forEach(loc => countries.add(loc.country_english));
  return Array.from(countries).sort();
}

export function getAvailableCategories(locations) {
  const categories = new Set();
  locations.forEach(loc => categories.add(loc.type));
  return Array.from(categories).sort();
}
