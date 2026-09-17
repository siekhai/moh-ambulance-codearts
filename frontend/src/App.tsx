import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();
  return (
    <div className="app">
      <h1>{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>
    </div>
  );
}

export default App;
