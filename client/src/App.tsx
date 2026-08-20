import { Routes, Route } from "react-router-dom";
import Catalog from "./components/Catalog";
import VideoPlayer from "./components/player/VideoPlayer";
import EmbedPlayer from "./components/EmbedPlayer";
import AdminApp from "./components/admin/AdminApp";
import AuthGate from "./components/auth/AuthGate";

export default function App() {
  return (
    <Routes>
      <Route path="/embed/:episodeId" element={<EmbedPlayer />} />
      <Route
        path="*"
        element={
          <AuthGate>
            <Routes>
              <Route path="/" element={<Catalog />} />
              <Route path="/title/:titleId" element={<VideoPlayer />} />
              <Route path="/title/:titleId/episode/:episodeId" element={<VideoPlayer />} />
              <Route path="/admin/*" element={<AdminApp />} />
            </Routes>
          </AuthGate>
        }
      />
    </Routes>
  );
}
