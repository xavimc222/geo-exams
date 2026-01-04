import { XMLParser } from 'fast-xml-parser';

export async function loadAndParseXML() {
  try {
    const response = await fetch('/data/source.xml');
    const xmlText = await response.text();
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: 'text'
    });
    
    const result = parser.parse(xmlText);
    return result;
  } catch (error) {
    console.error('Error loading XML:', error);
    throw error;
  }
}

export async function loadRiverGeometries() {
  try {
    const response = await fetch('/data/rivers.geojson');
    const riverData = await response.json();
    
    // Create a mapping between river names and their geometries
    const riverMap = new Map();
    
    riverData.features.forEach(feature => {
      const englishName = feature.properties.name;
      const czechName = feature.properties.name_czech;
      
      riverMap.set(englishName, feature.geometry);
      riverMap.set(czechName, feature.geometry);
    });
    
    return riverMap;
  } catch (error) {
    console.error('Error loading river geometries:', error);
    return new Map();
  }
}

export function extractLocations(parsedXML) {
  const locations = [];
  const maps = parsedXML.maps.map;
  
  // Ensure maps is an array
  const mapsArray = Array.isArray(maps) ? maps : [maps];
  
  mapsArray.forEach(map => {
    const country_english = map.country_english;
    const country_czech = map.country_czech;
    
    // Get all text_items
    const items = Array.isArray(map.text_item) ? map.text_item : [map.text_item];
    
    items.forEach(item => {
      // Skip intro texts - we'll handle them separately
      if (item.type === 'intro') return;
      
      // Only include items with coordinates
      if (!item.lat || !item.long) return;
      
      // The parser returns text content directly as a string
      const czechText = item.czech;
      const englishText = item.english;
      
      // Skip if no text content
      if (!czechText || !englishText) return;
      
      const location = {
        id: `${country_english}_${englishText}`.toLowerCase().replace(/\s+/g, '_'),
        type: item.type,
        country_english,
        country_czech,
        name_english: englishText,
        name_czech: czechText,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.long),
        origin: item.origin || 'unknown'
      };

      // Parse coordinates for rivers
      if (item.type === 'river' && item.coordinates) {
        const coordPairs = item.coordinates.split(';');
        location.geometry = {
          type: 'LineString',
          coordinates: coordPairs.map(pair => {
            const [lng, lat] = pair.split(',');
            return [parseFloat(lng), parseFloat(lat)];
          })
        };
      }
      
      locations.push(location);
    });
  });
  
  return locations;
}

export function extractCountryFacts(parsedXML) {
  const facts = [];
  const maps = parsedXML.maps.map;
  
  // Ensure maps is an array
  const mapsArray = Array.isArray(maps) ? maps : [maps];
  
  mapsArray.forEach(map => {
    const country_english = map.country_english;
    const country_czech = map.country_czech;
    
    // Get intro text
    const items = Array.isArray(map.text_item) ? map.text_item : [map.text_item];
    const introItem = items.find(item => item.type === 'intro');
    
    if (!introItem) return;
    
    // The parser returns text content directly as a string
    const czechText = introItem.czech;
    const englishText = introItem.english;
    
    // Parse Czech text for facts
    const fact = {
      country_english,
      country_czech,
      intro_czech: czechText,
      intro_english: englishText,
      // Add country coordinates for map centering
      lat: parseFloat(introItem.lat),
      lng: parseFloat(introItem.long)
    };

    // Extract capital city
    const capitalCzechMatch = czechText.match(/Hlavní město:\s*([^.]+)\./i);
    if (capitalCzechMatch) {
      fact.capital_czech = capitalCzechMatch[1].trim();
    }
    const capitalEnglishMatch = englishText.match(/Capital city:\s*([^.]+)\./i);
    if (capitalEnglishMatch) {
      fact.capital_english = capitalEnglishMatch[1].trim();
    }
    
    // Extract number of regions (Czech text)
    const regionsMatch = czechText.match(/(\d+)\s+(vojvodství|spolkových zemí)/i);
    if (regionsMatch) {
      fact.num_regions = parseInt(regionsMatch[1]);
    }
    
    // Extract federation status
    if (czechText.includes('není to federace')) {
      fact.is_federation = false;
    } else if (czechText.includes('je to federace')) {
      fact.is_federation = true;
    }
    
    // Extract area (in thousands of km²)
    const areaMatch = czechText.match(/(\d+)\s+tis\s+km/i);
    if (areaMatch) {
      fact.area_km2 = parseInt(areaMatch[1]) * 1000;
    }
    
    // Extract population (in millions)
    const popMatch = czechText.match(/(\d+)\s+mil\./i);
    if (popMatch) {
      fact.population_millions = parseInt(popMatch[1]);
    }
    
    // Extract largest river
    const riverMatch = czechText.match(/Největší řeka:\s*([^,]+)/i);
    if (riverMatch) {
      fact.largest_river_czech = riverMatch[1].trim();
      
      // Find corresponding English name from English text
      const engRiverMatch = englishText.match(/Largest river:\s*([^,]+)/i);
      if (engRiverMatch) {
        fact.largest_river_english = engRiverMatch[1].trim();
      }
    }
    
    // Extract other rivers
    const otherRiversMatch = czechText.match(/další:\s*(.+)\./i);
    if (otherRiversMatch) {
      const czechRivers = otherRiversMatch[1].split(',').map(r => r.trim());
      
      const engOtherMatch = englishText.match(/others:\s*(.+)\./i);
      const englishRivers = engOtherMatch 
        ? engOtherMatch[1].split(',').map(r => r.trim())
        : czechRivers;
      
      fact.other_rivers = czechRivers.map((czech, idx) => ({
        czech,
        english: englishRivers[idx] || czech
      }));
    }
    
    facts.push(fact);
  });
  
  return facts;
}
