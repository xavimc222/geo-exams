import MapDisplay from './MapDisplay';

export default function QuizQuestion({ question, onAnswer, feedback, language }) {
  if (!question) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>
          {language === 'czech' 
            ? 'Nelze vygenerovat otázku s aktuálními filtry. Zkuste změnit nastavení filtrů.'
            : 'Cannot generate a question with current filters. Try adjusting filter settings.'}
        </p>
      </div>
    );
  }

  const handleAnswer = (optionIndex) => {
    onAnswer(optionIndex);
  };

  return (
    <div>
      {/* Map Display for location questions */}
      {(question.questionType === 'location' || question.questionType === 'negative_location') && (
        <div style={{ marginBottom: '30px' }}>
          <MapDisplay 
            lat={question.questionType === 'location' ? question.location.lat : question.lat} 
            lng={question.questionType === 'location' ? question.location.lng : question.lng}
            questionType={question.locationType || 'city'}
            riverGeometry={
              question.locationType === 'river' && question.location && question.location.geometry 
                ? question.location.geometry 
                : null
            }
            riverName={
              question.locationType === 'river' && question.location
                ? (language === 'czech' ? question.location.name_czech : question.location.name_english)
                : null
            }
            hideMarker={question.hideMarker || false}
          />
        </div>
      )}

      {/* Question Text */}
      <div style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '25px',
        textAlign: 'center',
        color: '#333'
      }}>
        {question.question}
      </div>

      {/* Answer Options */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginBottom: '20px'
      }}>
        {question.options.map((option, index) => {
          let backgroundColor = '#ffffff';
          let borderColor = '#ddd';
          let cursor = 'pointer';
          
          if (feedback) {
            cursor = 'default';
            if (index === question.correctIndex) {
              backgroundColor = '#d4edda';
              borderColor = '#28a745';
            } else if (index === feedback.selectedIndex && !feedback.isCorrect) {
              backgroundColor = '#f8d7da';
              borderColor = '#dc3545';
            }
          }

          return (
            <button
              key={index}
              onClick={() => !feedback && handleAnswer(index)}
              disabled={!!feedback}
              style={{
                padding: '20px',
                fontSize: '18px',
                backgroundColor,
                border: `2px solid ${borderColor}`,
                borderRadius: '8px',
                cursor,
                textAlign: 'left',
                transition: 'all 0.2s',
                fontWeight: index === question.correctIndex && feedback ? 'bold' : 'normal',
                color: '#333'
              }}
              onMouseEnter={(e) => {
                if (!feedback) {
                  e.target.style.backgroundColor = '#f8f9fa';
                  e.target.style.borderColor = '#007bff';
                }
              }}
              onMouseLeave={(e) => {
                if (!feedback) {
                  e.target.style.backgroundColor = backgroundColor;
                  e.target.style.borderColor = borderColor;
                }
              }}
            >
              <strong>{String.fromCharCode(65 + index)})</strong> {option}
            </button>
          );
        })}
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: feedback.isCorrect ? '#d4edda' : '#f8d7da',
          border: `2px solid ${feedback.isCorrect ? '#28a745' : '#dc3545'}`,
          textAlign: 'center',
          color: '#333'
        }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            marginBottom: '10px',
            color: feedback.isCorrect ? '#155724' : '#721c24'
          }}>
            {feedback.isCorrect 
              ? (language === 'czech' ? '✓ Správně!' : '✓ Correct!')
              : (language === 'czech' ? '✗ Špatně!' : '✗ Incorrect!')}
          </div>
          <div style={{ fontSize: '16px' }}>
            {feedback.isCorrect
              ? (language === 'czech' ? '+1 bod' : '+1 point')
              : (language === 'czech' 
                  ? `Správná odpověď: ${question.options[question.correctIndex]}. -0.5 bodu`
                  : `Correct answer: ${question.options[question.correctIndex]}. -0.5 points`
                )}
          </div>
        </div>
      )}
    </div>
  );
}
