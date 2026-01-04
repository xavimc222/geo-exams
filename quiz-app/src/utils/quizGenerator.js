// Fisher-Yates shuffle algorithm
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function randomPick(array, count = 1) {
  const shuffled = shuffle(array);
  return count === 1 ? shuffled[0] : shuffled.slice(0, count);
}

export function generateLocationQuestion(filteredLocations, language) {
  if (filteredLocations.length < 4) {
    return null; // Not enough items to create a question
  }
  
  // 1. Group locations by type
  const locationsByType = {
    city: filteredLocations.filter(loc => loc.type === 'city'),
    region: filteredLocations.filter(loc => loc.type === 'region'),
    river: filteredLocations.filter(loc => loc.type === 'river')
  };
  
  // 2. Find types with enough locations (need 4 total: 1 correct + 3 wrong)
  const availableTypes = Object.keys(locationsByType).filter(type => 
    locationsByType[type].length >= 4
  );
  
  if (availableTypes.length === 0) {
    return null; // No type has enough items
  }
  
  // 3. Randomly select a type with equal probability
  const selectedType = randomPick(availableTypes);
  const locationsOfType = locationsByType[selectedType];
  
  // 4. Pick random location from selected type
  const correct = randomPick(locationsOfType);
  
  // 5. Get 3 wrong answers of same type (excluding the correct one)
  const sameTypeLocations = locationsOfType.filter(loc => loc.id !== correct.id);
  const wrong = randomPick(sameTypeLocations, 3);
  
  // 3. Shuffle options
  const allOptions = [correct, ...wrong];
  const shuffledOptions = shuffle(allOptions);
  const correctIndex = shuffledOptions.findIndex(opt => opt.id === correct.id);
  
  // Create question text
  const typeTranslations = {
    czech: {
      city: 'město',
      region: 'region',
      river: 'řeka'
    },
    english: {
      city: 'city',
      region: 'region',
      river: 'river'
    }
  };
  
  const typeName = typeTranslations[language][correct.type] || correct.type;
  const question = language === 'czech' 
    ? `Které ${typeName} je označeno na mapě?`
    : `Which ${typeName} is marked on the map?`;
  
  return {
    questionType: 'location',
    locationType: correct.type,
    location: correct, // Pass the entire location object to preserve geometry
    country: correct.country_english,
    question,
    options: shuffledOptions.map(opt => opt[`name_${language}`]),
    correctAnswer: correct[`name_${language}`],
    correctIndex
  };
}

export function generateFactQuestion(countryFacts, language) {
  if (countryFacts.length === 0) {
    return null;
  }
  
  const factTypes = [];
  
  // Check which fact types are available
  if (countryFacts.some(f => f.num_regions)) factTypes.push('num_regions');
  if (countryFacts.some(f => f.is_federation !== undefined)) factTypes.push('is_federation');
  if (countryFacts.some(f => f.area_km2)) factTypes.push('area_km2');
  if (countryFacts.some(f => f.population_millions)) factTypes.push('population_millions');
  if (countryFacts.some(f => f.largest_river_czech)) factTypes.push('largest_river');
  if (countryFacts.some(f => f.capital_czech)) factTypes.push('capital_city');
  
  if (factTypes.length === 0) {
    return null;
  }
  
  // Pick random country and fact type
  const country = randomPick(countryFacts);
  const factType = randomPick(factTypes);
  
  // Generate question and options based on fact type
  let question, options, correctAnswer, correctIndex;
  
  switch (factType) {
    case 'num_regions': {
      question = language === 'czech'
        ? `Kolik regionů má ${country.country_czech}?`
        : `How many regions does ${country.country_english} have?`;
      
      correctAnswer = country.num_regions;
      // Generate plausible wrong answers
      const numOptions = [
        correctAnswer,
        correctAnswer + 3,
        correctAnswer - 3,
        correctAnswer + 7
      ].filter(n => n > 0);
      options = shuffle(numOptions).slice(0, 4);
      correctIndex = options.indexOf(correctAnswer);
      break;
    }
      
    case 'is_federation': {
      question = language === 'czech'
        ? `Je ${country.country_czech} federace?`
        : `Is ${country.country_english} a federation?`;
      
      correctAnswer = country.is_federation 
        ? (language === 'czech' ? 'Ano' : 'Yes')
        : (language === 'czech' ? 'Ne' : 'No');
      
      options = language === 'czech' ? ['Ano', 'Ne'] : ['Yes', 'No'];
      // Add two more options for variety
      options.push(
        language === 'czech' ? 'Částečně' : 'Partially',
        language === 'czech' ? 'Pouze některé části' : 'Only some parts'
      );
      options = shuffle(options);
      correctIndex = options.indexOf(correctAnswer);
      break;
    }
      
    case 'area_km2': {
      question = language === 'czech'
        ? `Jaká je rozloha ${country.country_czech}?`
        : `What is the area of ${country.country_english}?`;
      
      correctAnswer = `${(country.area_km2 / 1000).toLocaleString()} ${language === 'czech' ? 'tis' : 'thousand'} km²`;
      
      // Generate wrong answers
      const areaOptions = [
        country.area_km2,
        country.area_km2 * 1.5,
        country.area_km2 * 0.7,
        country.area_km2 + 100000
      ].map(a => `${(a / 1000).toFixed(0)} ${language === 'czech' ? 'tis' : 'thousand'} km²`);
      
      options = shuffle(areaOptions).slice(0, 4);
      correctIndex = options.indexOf(correctAnswer);
      break;
    }
      
    case 'population_millions': {
      question = language === 'czech'
        ? `Kolik obyvatel má ${country.country_czech}?`
        : `What is the population of ${country.country_english}?`;
      
      correctAnswer = `${country.population_millions} ${language === 'czech' ? 'mil.' : 'million'}`;
      
      const popOptions = [
        country.population_millions,
        country.population_millions + 20,
        country.population_millions - 10,
        country.population_millions * 2
      ].filter(n => n > 0).map(n => `${n} ${language === 'czech' ? 'mil.' : 'million'}`);
      
      options = shuffle(popOptions).slice(0, 4);
      correctIndex = options.indexOf(correctAnswer);
      break;
    }
      
    case 'largest_river': {
      question = language === 'czech'
        ? `Jaká je největší řeka v ${country.country_czech}?`
        : `What is the largest river in ${country.country_english}?`;
      
      correctAnswer = language === 'czech' 
        ? country.largest_river_czech 
        : country.largest_river_english;
      
      // Get rivers from all countries
      const allRivers = [];
      countryFacts.forEach(cf => {
        if (cf.largest_river_czech) {
          allRivers.push(language === 'czech' ? cf.largest_river_czech : cf.largest_river_english);
        }
        if (cf.other_rivers) {
          cf.other_rivers.forEach(r => {
            allRivers.push(language === 'czech' ? r.czech : r.english);
          });
        }
      });
      
      // Remove correct answer from pool
      const wrongRivers = allRivers.filter(r => r !== correctAnswer);
      const selectedWrong = randomPick(wrongRivers, 3);
      
      options = shuffle([correctAnswer, ...selectedWrong]);
      correctIndex = options.indexOf(correctAnswer);
      break;
    }

    case 'capital_city': {
      question = language === 'czech'
        ? `Jaké je hlavní město země ${country.country_czech}?`
        : `What is the capital city of ${country.country_english}?`;
      
      correctAnswer = language === 'czech' ? country.capital_czech : country.capital_english;
      
      // Get capitals from other countries
      const otherCapitals = countryFacts
        .filter(cf => cf.country_english !== country.country_english && cf.capital_english)
        .map(cf => language === 'czech' ? cf.capital_czech : cf.capital_english);
      
      const selectedWrong = randomPick(otherCapitals, Math.min(3, otherCapitals.length));
      
      options = shuffle([correctAnswer, ...selectedWrong]);
      correctIndex = options.indexOf(correctAnswer);
      break;
    }
      
    default:
      return null;
  }
  
  return {
    questionType: 'fact',
    factType,
    country: country.country_english,
    question,
    options,
    correctAnswer,
    correctIndex
  };
}

export function generateNegativeLocationQuestion(filteredLocations, countryFacts, language) {
  // Only use cities and regions (not rivers as they can cross countries)
  const validLocations = filteredLocations.filter(loc => loc.type === 'city' || loc.type === 'region');
  
  if (validLocations.length < 4) {
    return null; // Not enough items to create a question
  }
  
  // Group locations by country
  const locationsByCountry = {};
  validLocations.forEach(location => {
    const country = location.country_english;
    if (!locationsByCountry[country]) {
      locationsByCountry[country] = [];
    }
    locationsByCountry[country].push(location);
  });
  
  // Find countries that have at least 3 items of the same type
  const availableCountries = [];
  Object.entries(locationsByCountry).forEach(([country, locations]) => {
    const citiesCount = locations.filter(loc => loc.type === 'city').length;
    const regionsCount = locations.filter(loc => loc.type === 'region').length;
    
    if (citiesCount >= 3) {
      availableCountries.push({ country, type: 'city', locations: locations.filter(loc => loc.type === 'city') });
    }
    if (regionsCount >= 3) {
      availableCountries.push({ country, type: 'region', locations: locations.filter(loc => loc.type === 'region') });
    }
  });
  
  if (availableCountries.length === 0) {
    return null; // No country has enough items of the same type
  }
  
  // Pick a target country and type
  const targetCountryData = randomPick(availableCountries);
  const targetCountry = targetCountryData.country;
  const locationType = targetCountryData.type;
  
  // Get 3 items from target country
  const targetCountryItems = randomPick(targetCountryData.locations, 3);
  
  // Get all items of same type from OTHER countries
  const otherCountryItems = validLocations.filter(loc => 
    loc.type === locationType && loc.country_english !== targetCountry
  );
  
  if (otherCountryItems.length === 0) {
    return null; // No items of same type in other countries
  }
  
  // Pick 1 item from other countries as the correct answer
  const correctAnswer = randomPick(otherCountryItems);
  
  // Create all options and shuffle
  const allOptions = [...targetCountryItems, correctAnswer];
  const shuffledOptions = shuffle(allOptions);
  const correctIndex = shuffledOptions.findIndex(opt => opt.id === correctAnswer.id);
  
  // Create question text with Czech declension handling
  const typeTranslations = {
    czech: {
      city: 'město',
      region: 'region'
    },
    english: {
      city: 'city',
      region: 'region'
    }
  };
  
  const typeName = typeTranslations[language][locationType] || locationType;
  const countryName = language === 'czech' ? targetCountryItems[0].country_czech : targetCountry;
  
  // Simple Czech declension for the question
  let question;
  if (language === 'czech') {
    // Use neutral phrasing to avoid complex declension
    question = `Které ${typeName} NEPATŘÍ do země: ${countryName}?`;
  } else {
    question = `Which ${typeName} is NOT in ${countryName}?`;
  }
  
  // Find target country facts for map centering
  const targetCountryFact = countryFacts.find(fact => fact.country_english === targetCountry);
  
  return {
    questionType: 'negative_location',
    locationType,
    targetCountry,
    // Use country coordinates for map centering
    lat: targetCountryFact ? targetCountryFact.lat : targetCountryItems[0].lat,
    lng: targetCountryFact ? targetCountryFact.lng : targetCountryItems[0].lng,
    question,
    options: shuffledOptions.map(opt => opt[`name_${language}`]),
    correctAnswer: correctAnswer[`name_${language}`],
    correctIndex,
    hideMarker: true // Flag to hide the marker on the map
  };
}

export function generateInverseLocationQuestion(filteredLocations, countryFacts, language) {
  // Only use cities and regions (not rivers as they can cross countries)
  const validLocations = filteredLocations.filter(loc => loc.type === 'city' || loc.type === 'region');
  
  if (validLocations.length === 0) {
    return null;
  }

  // Pick a random location
  const subject = randomPick(validLocations);
  
  const typeTranslations = {
    czech: {
      city: 'město',
      region: 'region'
    },
    english: {
      city: 'city',
      region: 'region'
    }
  };

  const typeName = typeTranslations[language][subject.type] || subject.type;
  const question = language === 'czech'
    ? `Ve které zemi se nachází ${typeName} ${subject.name_czech}?`
    : `In which country is the ${typeName} ${subject.name_english}?`;

  const correctAnswer = language === 'czech' ? subject.country_czech : subject.country_english;
  
  // Get other countries from available country facts
  const otherCountries = countryFacts
    .filter(cf => cf.country_english !== subject.country_english)
    .map(cf => language === 'czech' ? cf.country_czech : cf.country_english);

  const selectedWrong = randomPick(otherCountries, Math.min(3, otherCountries.length));
  
  const options = shuffle([correctAnswer, ...selectedWrong]);
  const correctIndex = options.indexOf(correctAnswer);

  return {
    questionType: 'location', // Reuse location type for map display
    locationType: subject.type,
    location: subject,
    country: subject.country_english,
    question,
    options,
    correctAnswer,
    correctIndex
  };
}

export function generateQuestion(allLocations, filteredLocations, countryFacts, filters, language) {
  const availableTypes = [];
  
  const includeFactQuestions = filters.categories.includes('facts');
  const includeNegativeQuestions = filters.categories.includes('negative');
  
  // Filter country facts based on selected countries
  const filteredCountryFacts = countryFacts.filter(fact => {
    return filters.countries.length === 0 || filters.countries.includes(fact.country_english);
  });
  
  // For negative questions, we need to use all cities and regions from enabled countries
  // regardless of what location categories are selected
  if (includeNegativeQuestions) {
    const negativeFilteredLocations = allLocations.filter(loc => {
      // Apply country filter
      const countryMatch = filters.countries.length === 0 || filters.countries.includes(loc.country_english);
      // Apply origin filter if needed
      const originMatch = !filters.originalOnly || loc.origin === 'original';
      // Only cities and regions for negative questions
      const typeMatch = loc.type === 'city' || loc.type === 'region';
      
      return countryMatch && originMatch && typeMatch;
    });
    
    if (negativeFilteredLocations.length >= 4) {
      availableTypes.push('negative_location');
    }
  }
  
  // Regular location questions use the normal filtered locations
  if (filteredLocations.length >= 4) {
    availableTypes.push('location');
    
    // Add inverse location questions if we have enough countries to provide options
    const validInverseLocations = filteredLocations.filter(loc => loc.type === 'city' || loc.type === 'region');
    if (validInverseLocations.length > 0 && filteredCountryFacts.length >= 2) {
      availableTypes.push('inverse_location');
    }
  }
  
  // Use filtered country facts for fact questions
  if (includeFactQuestions && filteredCountryFacts.length > 0) {
    availableTypes.push('fact');
  }
  
  if (availableTypes.length === 0) {
    return null;
  }
  
  // Randomly choose question type
  const questionType = randomPick(availableTypes);
  
  if (questionType === 'location') {
    return generateLocationQuestion(filteredLocations, language);
  } else if (questionType === 'inverse_location') {
    return generateInverseLocationQuestion(filteredLocations, filteredCountryFacts, language);
  } else if (questionType === 'negative_location') {
    // Use special filtering for negative questions
    const negativeFilteredLocations = allLocations.filter(loc => {
      const countryMatch = filters.countries.length === 0 || filters.countries.includes(loc.country_english);
      const originMatch = !filters.originalOnly || loc.origin === 'original';
      const typeMatch = loc.type === 'city' || loc.type === 'region';
      return countryMatch && originMatch && typeMatch;
    });
    return generateNegativeLocationQuestion(negativeFilteredLocations, filteredCountryFacts, language);
  } else {
    // Use filtered country facts for fact questions
    return generateFactQuestion(filteredCountryFacts, language);
  }
}
