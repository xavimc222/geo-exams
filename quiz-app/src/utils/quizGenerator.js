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
  
  // 1. Pick random location
  const correct = randomPick(filteredLocations);
  
  // 2. Get 3 wrong answers of same type
  const sameTypeLocations = filteredLocations.filter(loc => 
    loc.type === correct.type && loc.id !== correct.id
  );
  
  if (sameTypeLocations.length < 3) {
    return null; // Not enough items of same type
  }
  
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
    location: { lat: correct.lat, lng: correct.lng },
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

export function generateQuestion(filteredLocations, countryFacts, includeFactQuestions, language) {
  const availableTypes = [];
  
  if (filteredLocations.length >= 4) {
    availableTypes.push('location');
  }
  
  if (includeFactQuestions && countryFacts.length > 0) {
    availableTypes.push('fact');
  }
  
  if (availableTypes.length === 0) {
    return null;
  }
  
  // Randomly choose question type
  const questionType = randomPick(availableTypes);
  
  if (questionType === 'location') {
    return generateLocationQuestion(filteredLocations, language);
  } else {
    return generateFactQuestion(countryFacts, language);
  }
}
