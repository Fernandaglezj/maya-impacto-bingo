import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Index';
import Resultados from './pages/Resultados';
import ResultadosDM from './pages/ResultadosDM';
import AdminImagenes from './pages/AdminImagenes';
import Bingo from './pages/bingo';
import DMLogin from './pages/DMLogin';
import DMBingo from './pages/DMBingo';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bingo" element={<Bingo />} />
        <Route path="/dm" element={<DMLogin />} />
        <Route path="/dmbingo" element={<DMBingo />} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/resultadosdm" element={<ResultadosDM />} />
        <Route path="/admin/imagenes" element={<AdminImagenes />} />
        </Routes>
      <Toaster />
      </BrowserRouter>
);
}

export default App;
