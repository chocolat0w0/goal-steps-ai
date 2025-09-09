import { useState } from 'react';
import { type Project } from '~/types';
import Layout from '~/components/Layout';
import ProjectsPage from '~/pages/ProjectsPage';
import ProjectDetailPage from '~/pages/ProjectDetailPage';
import '~/styles/App.css';

function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  return (
    <Layout>
      {selectedProject ? (
        <ProjectDetailPage
          project={selectedProject}
          onBackToProjects={handleBackToProjects}
        />
      ) : (
        <ProjectsPage onSelectProject={handleSelectProject} />
      )}
    </Layout>
  );
}

export default App;
