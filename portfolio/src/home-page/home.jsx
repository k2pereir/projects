import React, { useState } from 'react';
import './Home.css';
import bg from '../assets/bg.jpg';

const Home = () => {
  const [hoveredFile, setHoveredFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const projects = [
    {
      id: 1,
      name: 'Rock, Paper, Scissors',
      color: '#f0d7df',
      description: 'Rock, paper, scissors match against your computer cam?! ',
      details: 'Used OpenCV and MediaPipe to collect hand gesture data, then trained a model with TensorFlow to classify the gestures. The model is integrated into a Flask web app that uses the webcam to play rock, paper, scissors against the user',
      link: 'https://github.com/k2pereir/rockpaperscissors',
      status: 'Finished',
      technologies: ['Python, Flask, TensorFlow, OpenCV, MediaPipe'],
      timeline: 'December 2024',
      teamSize: 'Solo Project',
    },
    {
      id: 2,
      name: 'Class Profile',
      color: '#f7e6da',
      description: 'MGTE \'29 Class Profile',
      details: 'Collaborated with classmates to create a web application as a snapshot of our cohort\'s demographics, backgrounds, experiences, and interests. The project involved data collection, front-end and back-end development, and deployment.',
      link: 'https://github.com/hwtrs/mgte-29-class-profile/tree/main',
      status: 'In progress',
      technologies: ['React, Node.js, SCSS'],
      timeline: 'April 2025 - Current',
      teamSize: 'Team of 15+ people',
    },
    {
      id: 3,
      name: 'Sewstainability',
      color: '#c4dbd9',
      description: 'Promoting sustainable fashion through clothing resuse and resale',
      details: 'Developed a platform for users to track their clothing reuse and sell unused clothing on an online marketplace',
      link: 'https://github.com/k2pereir/technova_project',
      status: 'Completed',
      technologies: ['Streamlit, Python, OpenCV'],
      timeline: 'September 2024',
      teamSize: 'Team of 3',
    },
    {
      id: 4,
      name: 'Sign Quest',
      color: '#c8c7d6',
      description: 'A sign language learning app',
      details: 'Used OpenCV and MediaPipe to collect hand gesture data, then created a web app that uses the webcam to help users learn sign language',
      link: 'https://github.com/ohi-711/jamhacks8project',
      status: 'Finished',
      technologies: ['OpenCV, MediaPipe, Python'],
      timeline: 'June 2024',
      teamSize: 'Team of 4',
    },
    {
      id: 5,
      name: 'Music Tech',
      color: '#cae0e4',
      description: 'Creating a music recording app',
      details: 'Developing a music recording app to record, edit, and layer tracks using JUCE',
      link: 'https://github.com/k2pereir/juce',
      status: 'In progress',
      technologies: ['JUCE, C++'],
      timeline: 'August 2025 - Current',
      teamSize: 'Solo Project',
    },
    {
      id: 6,
      name: 'Mars Rover',
      color: '#ffcad4',
      description: 'Developing the software for a Mars Rover',
      details: 'Working with Watonomous to develop the software for a Mars Rover to compete in the University Rover Challenge, focusing on perception and navigation. I am responsible for developing the costmap and path planning algorithms using ROS and C++',
      link: 'https://github.com/WATonomous/wato_rover',
      status: 'In progress',
      technologies: ['ROS, C++'],
      timeline: 'May 2025 - Current',
      teamSize: 'Team of 5',
    },
    
  ];

  const handleFileHover = (fileId) => {
    setHoveredFile(fileId);
  };

  const handleFileLeave = () => {
    setHoveredFile(null);
  };

  const handleFileClick = (project) => {
    setSelectedFile(project);
  };

  const closeSheet = () => {
    setSelectedFile(null);
  };

  return (
    <div className="home-container">
      <div 
        className={`file-folder`}
      >
        <div className="folder-body">
          <div className="folder-tab"></div>
          <div className="folder-label">
            <span>My Projects</span>
          </div>
          
          <div className="files-container">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="file-tab"
                style={{
                  backgroundColor: project.color,
                  zIndex: projects.length - index
                }}
                onMouseEnter={() => handleFileHover(project.id)}
                onMouseLeave={handleFileLeave}
                onClick={() => handleFileClick(project)}
              >
                <span className="file-name">{project.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedFile && (
        <div className="sheet-overlay" onClick={closeSheet}>
          <div className="project-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeSheet}>×</button>
            <div className="sheet-header" style={{ backgroundColor: selectedFile.color }}>
              <h2>{selectedFile.name}</h2>
            </div>
            <div className="sheet-content">
              <p className="tagline">{selectedFile.description}</p>
              <p><strong>Details:</strong> {selectedFile.details}</p>
              <div className="project-details">
                <h3>Project Details</h3>
                <ul>
                  <li><strong>Status:</strong> {selectedFile.status}</li>
                  <li><strong>Technologies:</strong> {selectedFile.technologies && selectedFile.technologies.join(', ')}</li>
                  <li><strong>Timeline:</strong> {selectedFile.timeline}</li>
                  <li><strong>Team Size:</strong> {selectedFile.teamSize}</li>
                </ul>
                <div className="project-actions">
                  <a href={selectedFile.link} target="_blank" rel="noopener noreferrer">
                    <button className="action-btn primary">View Project</button>
                  </a>
                </div>
              </div>
            </div> 

          </div>
        </div>
      )}
    </div>
  );
};

export default Home;