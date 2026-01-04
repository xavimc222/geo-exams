import { useState, useEffect, useCallback } from 'react';
import { loadAndParseXML, extractLocations, extractCountryFacts } from './utils/xmlParser';
import { applyFilters } from './utils/filterLogic';
import { generateQuestion } from './utils/quizGenerator';
import FilterPanel from './components/FilterPanel';
import QuizQuestion from './components/QuizQuestion';
import LanguageToggle from './components/LanguageToggle';
import ScoreDisplay from './components/ScoreDisplay';
import './App.css';

function App() {
  const [language, setLanguage] = useState('czech');
  const [allLocations, setAllLocations] = useState([]);
  const [countryFacts, setCountryFacts] = useState([]);
  const [filters, setFilters] = useState({
    originalOnly: false,
    categories: ['city', 'region', 'river', 'facts', 'negative'],
    countries: ['Poland', 'Germany', 'Austria']
  });
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const parsedXML = await loadAndParseXML();
        const locations = extractLocations(parsedXML);
        const facts = extractCountryFacts(parsedXML);
        
        setAllLocations(locations);
        setCountryFacts(facts);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load quiz data. Please refresh the page.');
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const generateNewQuestion = useCallback(() => {
    const filteredLocations = applyFilters(allLocations, filters);
    
    const question = generateQuestion(
      allLocations,
      filteredLocations,
      countryFacts,
      filters,
      language
    );
    
    setCurrentQuestion(question);
    setFeedback(null);
  }, [allLocations, filters, countryFacts, language]);

  // Generate initial question when data loads
  useEffect(() => {
    if (allLocations.length > 0 && !currentQuestion) {
      // Use setTimeout to avoid calling setState directly in effect
      const timer = setTimeout(() => {
        generateNewQuestion();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [allLocations, currentQuestion, generateNewQuestion]);

  const handleAnswer = (selectedIndex) => {
    if (!currentQuestion) return;
    
    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    
    // Update score
    if (isCorrect) {
      setScore(score + 1);
    } else {
      setScore(score - 0.5);
    }
    
    // Show feedback
    setFeedback({
      isCorrect,
      selectedIndex
    });
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    generateNewQuestion();
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setFeedback(null);
    
    // Generate new question with updated filters
    const filteredLocations = applyFilters(allLocations, newFilters);
    const question = generateQuestion(allLocations, filteredLocations, countryFacts, newFilters, language);
    setCurrentQuestion(question);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    // Generate new question with new language
    setTimeout(() => {
      const filteredLocations = applyFilters(allLocations, filters);
      const question = generateQuestion(allLocations, filteredLocations, countryFacts, filters, newLanguage);
      setCurrentQuestion(question);
      setFeedback(null);
    }, 0);
  };

  if (loading) {
    return (
      <div className="app">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Loading quiz data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2 style={{ color: '#dc3545' }}>{error}</h2>
        </div>
      </div>
    );
  }

  const translations = {
    czech: {
      title: 'Zeměpisný kvíz',
      subtitle: 'Polsko, Německo, Rakousko',
      nextQuestion: 'Další otázka'
    },
    english: {
      title: 'Geography Quiz',
      subtitle: 'Poland, Germany, Austria',
      nextQuestion: 'Next Question'
    }
  };

  const t = translations[language];

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="title-section">
            <h1>{t.title}</h1>
            <p className="subtitle">{t.subtitle}</p>
          </div>
          <LanguageToggle language={language} onChange={handleLanguageChange} />
        </div>
      </header>

      <div className="main-content">
        <div className="controls-section">
          <ScoreDisplay score={score} language={language} />
          <FilterPanel 
            filters={filters} 
            onChange={handleFilterChange} 
            language={language} 
          />
        </div>

        <main className="quiz-area">
          <QuizQuestion 
            question={currentQuestion}
            onAnswer={handleAnswer}
            feedback={feedback}
            language={language}
          />
          
          {feedback && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={handleNextQuestion}
                style={{
                  padding: '15px 40px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  backgroundColor: '#007bff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                {t.nextQuestion}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
