import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Exhibition from './pages/Exhibition';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Exhibition />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
