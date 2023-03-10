import './App.css';
import Home from './components/home';
import {Route, Routes} from 'react-router-dom'
import Chat from './components/chat';

function App() {
  return (
    <Routes>
      <Route path='/' exact element={<Home />} />
      <Route path='/chat/:roomID' exact element={<Chat />} />
    </Routes>
  );
}

export default App;
