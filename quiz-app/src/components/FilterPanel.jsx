import { useState } from 'react';

export default function FilterPanel({ filters, onChange, language }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  const translations = {
    czech: {
      title: 'Filtry',
      originalOnly: 'Pouze originální položky',
      categories: 'Kategorie:',
      city: 'Města',
      region: 'Regiony',
      river: 'Řeky',
      facts: 'Fakta',
      countries: 'Země:',
      poland: 'Polsko',
      germany: 'Německo',
      austria: 'Rakousko',
      slovakia: 'Slovensko',
      slovenia: 'Slovinsko'
    },
    english: {
      title: 'Filters',
      originalOnly: 'Original items only',
      categories: 'Categories:',
      city: 'Cities',
      region: 'Regions',
      river: 'Rivers',
      facts: 'Facts',
      countries: 'Countries:',
      poland: 'Poland',
      germany: 'Germany',
      austria: 'Austria',
      slovakia: 'Slovakia',
      slovenia: 'Slovenia'
    }
  };

  const t = translations[language];

  const handleCategoryChange = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onChange({ ...filters, categories: newCategories });
  };

  const handleCountryChange = (country) => {
    const newCountries = filters.countries.includes(country)
      ? filters.countries.filter(c => c !== country)
      : [...filters.countries, country];
    onChange({ ...filters, countries: newCountries });
  };

  return (
    <div style={{
      padding: '15px 20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '10px',
      border: '1px solid #dee2e6'
    }}>
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 0, color: '#333' }}>{t.title}</h3>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#666' }}>
          {isCollapsed ? '▼' : '▲'}
        </span>
      </div>
      
      {!isCollapsed && (
        <div style={{ marginTop: '20px' }}>
          {/* Original Only Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#333' }}>
          <input
            type="checkbox"
            checked={filters.originalOnly}
            onChange={(e) => onChange({ ...filters, originalOnly: e.target.checked })}
            style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: filters.originalOnly ? 'bold' : 'normal' }}>
            {t.originalOnly}
          </span>
        </label>
      </div>

      {/* Categories */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>{t.categories}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {['city', 'region', 'river', 'facts'].map(category => (
            <label key={category} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#333' }}>
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => handleCategoryChange(category)}
                style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>{t[category]}</span>
            </label>
          ))}
        </div>
      </div>

          {/* Countries */}
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>{t.countries}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {['Poland', 'Germany', 'Austria', 'Slovakia', 'Slovenia'].map(country => (
                <label key={country} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#333' }}>
                  <input
                    type="checkbox"
                    checked={filters.countries.includes(country)}
                    onChange={() => handleCountryChange(country)}
                    style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>{t[country.toLowerCase()]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
