export default function LanguageToggle({ language, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <button
        onClick={() => onChange('czech')}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          fontWeight: language === 'czech' ? 'bold' : 'normal',
          backgroundColor: language === 'czech' ? '#007bff' : '#ffffff',
          color: language === 'czech' ? '#ffffff' : '#333',
          border: '2px solid #007bff',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        CZ
      </button>
      <button
        onClick={() => onChange('english')}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          fontWeight: language === 'english' ? 'bold' : 'normal',
          backgroundColor: language === 'english' ? '#007bff' : '#ffffff',
          color: language === 'english' ? '#ffffff' : '#333',
          border: '2px solid #007bff',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        EN
      </button>
    </div>
  );
}
