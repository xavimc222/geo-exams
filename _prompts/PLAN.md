# Geography Quiz Application - Implementation Plan

## Project Overview

A React-based geography quiz application that uses OpenStreetMap to test knowledge of European geography (Poland, Germany, Austria) through interactive map-based and factual questions.

## Core Requirements

### Data Source
- **Input**: `data/poland-germany-austria.xml`
- **Content**: Cities, regions, rivers, and country facts for Poland, Germany, and Austria
- **Languages**: Czech and English (bilingual support)
- **No Backend**: All data hard-coded in XML, no server required

### Question Types

#### Type A: Location Questions (Map-Based)
- Display a marker on OpenStreetMap
- Show only political borders (no labels)
- Ask: "Which city/region/river is marked on the map?"
- 4 multiple choice options from filtered pool

#### Type B: Factual Questions (Text-Based)
- Ask about country statistics from intro texts
- Examples:
  - "What is the area of Poland?"
  - "How many federal states does Germany have?"
  - "What is the largest river in Austria?"
  - "Which country is a federation?"
- 4 multiple choice options with numerical/text answers

### Scoring System
- **Correct answer**: +1 point
- **Incorrect answer**: -0.5 points
- Score can be negative
- Unlimited questions (continuous generation)

### Filter System

Three independent filter categories:

1. **Origin Filter** (Toggle)
   - "Original items only" checkbox
   - When enabled: only show items with `origin="original"` attribute
   - Highlights content from original class notes

2. **Category Filter** (Multi-select)
   - Cities
   - Regions
   - Rivers
   - Facts (from intro texts)
   - Multiple selections allowed

3. **Country Filter** (Multi-select)
   - Poland
   - Germany
   - Austria
   - Multiple selections allowed

### Quiz Pool Logic
```
1. Apply all active filters → Create filtered pool
2. Pick random item from filtered pool → Question subject
3. Pick 3 random items from SAME filtered pool → Wrong answers
4. Shuffle all 4 options
5. Present question
```

**Important**: All 4 options come from the filtered pool, ensuring consistency.

### Language Support
- Toggle between Czech and English
- Affects all text: questions, answers, UI labels
- Uses `<czech>` and `<english>` tags from XML

## Technical Architecture

### Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Map Library**: React-Leaflet + Leaflet
- **XML Parsing**: fast-xml-parser
- **Styling**: CSS (desktop-optimized, no mobile responsive needed)

### Project Structure
```
geo-exams/
├── public/
│   └── data/
│       └── poland-germany-austria.xml
├── src/
│   ├── components/
│   │   ├── MapDisplay.jsx          # OpenStreetMap with marker
│   │   ├── QuizQuestion.jsx        # Question display + answers
│   │   ├── FilterPanel.jsx         # Filter controls
│   │   ├── ScoreDisplay.jsx        # Score tracker
│   │   ├── LanguageToggle.jsx      # Czech/English switch
│   │   └── FeedbackDisplay.jsx     # Answer feedback
│   ├── hooks/
│   │   └── useQuizData.js          # Data loading & filtering
│   ├── utils/
│   │   ├── xmlParser.js            # Parse XML to JS objects
│   │   ├── quizGenerator.js        # Generate questions
│   │   ├── filterLogic.js          # Apply filters
│   │   └── factExtractor.js        # Parse intro text facts
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── data/
│   └── poland-germany-austria.xml
├── _prompts/
│   ├── PROMPTS.md
│   └── PLAN.md (this file)
├── package.json
├── vite.config.js
└── index.html
```

## Data Structure Design

### Parsed Location Data
```javascript
{
  id: "poland_warsaw",
  type: "city",                    // "city" | "region" | "river"
  country_english: "Poland",
  country_czech: "Polsko",
  name_english: "Warsaw",
  name_czech: "Varšava",
  lat: 52.2297,
  lng: 21.0122,
  origin: "original"               // or "supplemental"
}
```

### Parsed Country Facts
```javascript
{
  country_english: "Poland",
  country_czech: "Polsko",
  num_regions: 16,
  is_federation: false,
  area_km2: 312000,
  population_millions: 38,
  largest_river_english: "Vistula",
  largest_river_czech: "Visla",
  other_rivers: [
    { english: "Oder", czech: "Odra" }
  ]
}
```

### Fact Extraction Strategy

Parse intro text using regex patterns:
```
"Polsko: členění - 16 vojvodství (kraje) – není to federace. 
Rozloha: 312 tis km² (9. MÍSTO). Počet obyvatel: 38 mil. 
Největší řeka: Visla, další: Odra."
```

Extract:
- Number of regions: `(\d+) vojvodství` → 16
- Federation status: `(není to|je to) federace` → false/true
- Area: `(\d+) tis km²` → 312000
- Population: `(\d+) mil` → 38
- Rivers: Parse after "Největší řeka:" and "další:"

## Question Generation Algorithm

### Location Questions
```javascript
function generateLocationQuestion(filteredLocations, language) {
  // 1. Pick random location
  const correct = randomPick(filteredLocations);
  
  // 2. Get 3 wrong answers of same type
  const wrong = randomPick(
    filteredLocations.filter(loc => 
      loc.type === correct.type && 
      loc.id !== correct.id
    ),
    3
  );
  
  // 3. Shuffle options
  const options = shuffle([correct, ...wrong]);
  
  return {
    questionType: 'location',
    location: { lat: correct.lat, lng: correct.lng },
    country: correct.country_english,
    question: language === 'czech' 
      ? `Která ${correct.type} je označena na mapě?`
      : `Which ${correct.type} is marked on the map?`,
    options: options.map(o => o[`name_${language}`]),
    correctAnswer: correct[`name_${language}`],
    correctIndex: options.indexOf(correct)
  };
}
```

### Factual Questions
```javascript
function generateFactQuestion(countryFacts, language) {
  const factTypes = [
    'num_regions',
    'is_federation', 
    'area_km2',
    'population_millions',
    'largest_river'
  ];
  
  // Pick random country and fact type
  const country = randomPick(countryFacts);
  const factType = randomPick(factTypes);
  
  // Generate question and options based on fact type
  // Create 3 plausible wrong answers
  // Shuffle options
  
  return {
    questionType: 'fact',
    question: generateFactQuestionText(country, factType, language),
    options: generateFactOptions(country, factType, countryFacts, language),
    correctAnswer: country[factType],
    correctIndex: /* index of correct answer */
  };
}
```

## Filter Implementation

```javascript
function applyFilters(allData, filters) {
  let pool = [...allData.locations];
  
  // Origin filter
  if (filters.originalOnly) {
    pool = pool.filter(item => item.origin === 'original');
  }
  
  // Category filter
  if (filters.categories.length > 0) {
    pool = pool.filter(item => filters.categories.includes(item.type));
  }
  
  // Country filter
  if (filters.countries.length > 0) {
    pool = pool.filter(item => 
      filters.countries.includes(item.country_english)
    );
  }
  
  // Facts filter (separate handling)
  const includeFactQuestions = filters.categories.includes('facts');
  
  return { locationPool: pool, includeFactQuestions };
}
```

## Map Display Specifications

### OpenStreetMap Configuration
```javascript
<MapContainer
  center={[50.5, 13.5]}        // Central Europe
  zoom={6}
  style={{ height: '500px', width: '100%' }}
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; OpenStreetMap contributors'
  />
  
  {/* Country borders overlay (optional GeoJSON) */}
  <GeoJSON data={countryBorders} style={{ color: '#333', weight: 2 }} />
  
  {/* Question marker */}
  <Marker position={[lat, lng]}>
    <Popup>Question Location</Popup>
  </Marker>
</MapContainer>
```

### Zoom Levels
- Close-up city: zoom 10-12
- Region view: zoom 7-9
- River view: zoom 6-8
- Adjust dynamically based on location type

### Political Borders
Options:
1. Use base OpenStreetMap tiles (shows borders inherently)
2. Add GeoJSON overlay with country boundaries
3. Use custom tileset with minimal labels

**Recommendation**: Use standard OSM tiles + add subtle country border highlighting if needed.

## UI Component Breakdown

### App.jsx
- Main application container
- State management (score, filters, language, current question)
- Quiz flow control

### FilterPanel.jsx
```jsx
<FilterPanel 
  filters={filters}
  onChange={handleFilterChange}
  language={language}
/>
```
- Origin toggle
- Category checkboxes
- Country checkboxes
- Apply button

### QuizQuestion.jsx
```jsx
<QuizQuestion
  question={currentQuestion}
  onAnswer={handleAnswer}
  language={language}
/>
```
- Conditional rendering: Map OR Text question
- 4 answer buttons
- Answer feedback display

### MapDisplay.jsx
```jsx
<MapDisplay
  lat={lat}
  lng={lng}
  country={country}
/>
```
- OpenStreetMap integration
- Marker display
- Country borders

### ScoreDisplay.jsx
```jsx
<ScoreDisplay score={score} />
```
- Current score
- Optional: Total questions answered
- Optional: Accuracy percentage

### LanguageToggle.jsx
```jsx
<LanguageToggle
  language={language}
  onChange={setLanguage}
/>
```
- Two buttons: CZ / EN
- Active state styling

## Implementation Phases

### Phase 1: Project Setup (30 min)
- [ ] Create Vite + React project
- [ ] Install dependencies
- [ ] Set up folder structure
- [ ] Copy XML file to public/data/

### Phase 2: Data Layer (1-2 hours)
- [ ] Create xmlParser.js
- [ ] Parse location items from XML
- [ ] Create factExtractor.js
- [ ] Extract country facts from intro texts
- [ ] Test data structure output

### Phase 3: Filter System (1 hour)
- [ ] Create filterLogic.js
- [ ] Implement filter functions
- [ ] Build FilterPanel component
- [ ] Test filter combinations

### Phase 4: Quiz Logic (1-2 hours)
- [ ] Create quizGenerator.js
- [ ] Implement location question generation
- [ ] Implement fact question generation
- [ ] Ensure option uniqueness
- [ ] Test randomization

### Phase 5: Map Component (1 hour)
- [ ] Install react-leaflet
- [ ] Create MapDisplay component
- [ ] Configure OpenStreetMap tiles
- [ ] Add marker display
- [ ] Test different locations

### Phase 6: UI Components (2 hours)
- [ ] Build QuizQuestion component
- [ ] Create answer buttons
- [ ] Add feedback display (correct/incorrect)
- [ ] Build ScoreDisplay component
- [ ] Create LanguageToggle component

### Phase 7: Main App Logic (1-2 hours)
- [ ] Integrate all components in App.jsx
- [ ] Implement scoring system (+1 / -0.5)
- [ ] Add question flow (Next button)
- [ ] Handle language switching
- [ ] Test complete flow

### Phase 8: Styling & Polish (1-2 hours)
- [ ] Desktop-optimized layout
- [ ] Color scheme (green/red feedback)
- [ ] Smooth transitions
- [ ] Responsive component sizing
- [ ] Final UX improvements

### Phase 9: Testing (1 hour)
- [ ] Test all filter combinations
- [ ] Verify question generation
- [ ] Check scoring accuracy
- [ ] Test language toggle
- [ ] Edge cases (empty filters, etc.)

## Technical Considerations

### XML Parsing
- Use fast-xml-parser with options for attributes
- Handle both text content and attributes
- Preserve language pairs (czech/english)

### Random Selection
- Use Fisher-Yates shuffle for fairness
- Ensure no duplicate options
- Handle edge cases (< 4 items in pool)

### State Management
- Use React hooks (useState, useEffect)
- Consider useReducer for complex state
- No need for Redux (simple app)

### Error Handling
- Graceful handling of empty filter results
- Fallback when < 4 options available
- Clear user messaging

### Performance
- Memoize filtered pools
- Lazy load map tiles
- Optimize re-renders

## Example Question Flow

```
Initial State:
- Score: 0
- Filters: All enabled
- Language: Czech

Question 1 (Location):
[Map showing Warsaw marker]
"Které město je označeno na mapě?"
A) Varšava ✓
B) Krakov
C) Berlín
D) Vídeň
→ User clicks A → Score: 1.0 → ✓ "Správně! +1 bod"

Question 2 (Fact):
"Jaká je rozloha Polska?"
A) 84 000 km²
B) 312 000 km² ✓
C) 357 000 km²
D) 450 000 km²
→ User clicks C → Score: 0.5 → ✗ "Špatně! Správná odpověď: 312 000 km². -0.5 bodu"

Question 3 (Location with filters):
Filters: Original only, Cities, Poland
[Map showing Gdańsk]
"Které město je označeno na mapě?"
A) Štětín
B) Gdaňsk ✓
C) Poznaň
D) Loď
→ User clicks B → Score: 1.5 → ✓ "Správně! +1 bod"

Continues infinitely...
```

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "fast-xml-parser": "^4.3.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}
```

## Success Criteria

- ✅ Map displays correctly with OpenStreetMap
- ✅ Political borders visible
- ✅ Both location and fact questions work
- ✅ Filters work independently and in combination
- ✅ Scoring system accurate (+1 / -0.5)
- ✅ Language toggle affects all text
- ✅ Questions generate randomly and infinitely
- ✅ All 4 options come from filtered pool
- ✅ Immediate feedback on answers
- ✅ Desktop-optimized UI
- ✅ No backend required (static app)

## Future Enhancements (Optional)

- Statistics dashboard (accuracy over time)
- Question history (review past questions)
- Difficulty levels (based on origin or obscurity)
- Custom question sets
- Export/import filters as presets
- Keyboard shortcuts
- Sound effects
- Dark mode

---

**Last Updated**: January 4, 2026
**Status**: Ready for Implementation
