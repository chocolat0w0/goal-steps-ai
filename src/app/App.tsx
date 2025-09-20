import { Routes, Route } from 'react-router-dom';
import Layout from '~/components/Layout';
import ProjectsPage from '~/pages/ProjectsPage';
import ProjectDetailPage from '~/pages/ProjectDetailPage';
import '~/styles/App.css';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
