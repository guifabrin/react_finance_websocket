import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { WebSocketComponent } from './components/WebSocketComponent';
import './i18n';
import { withNamespaces } from 'react-i18next';
function App({ t }) {
  return (
    <div className="App">
      <WebSocketComponent t={t} />
    </div>
  );
}

export default withNamespaces()(App);
