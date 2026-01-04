export default function ScoreDisplay({ score, language }) {
  const translations = {
    czech: {
      score: 'Skóre'
    },
    english: {
      score: 'Score'
    }
  };

  const t = translations[language];

  return (
    <div style={{
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: '#ffffff',
      borderRadius: '8px',
      fontSize: '20px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '5px'
    }}>
      {t.score}: {score.toFixed(1)}
    </div>
  );
}
