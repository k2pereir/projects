import React, { useState } from 'react';
import './Home.css';
import bg from '../assets/bg.jpg';

const Home = () => {
  const [hoveredFile, setHoveredFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const projects = [
    {
      id: 1,
      name: 'Mars Rover',
      color: '#F0F8FF',
      description: 'Making a Mars Rover!',
      details: 'Working with the University of Waterloo\'s Watonomous design team to develop the software for a Mars Rover to compete in the University Rover Challenge, focusing on perception and navigation. I am responsible for developing the costmap and path planning algorithms using ROS and C++',
      link: 'https://github.com/WATonomous/wato_rover',
      status: 'In progress',
      technologies: ['ROS, C++'],
      timeline: 'May 2025 - Current',
      teamSize: 'Team of 5',
    },
    {
      id: 2,
      name: 'Rock, Paper, Scissors',
      color: '#E6E6FA',
      description: 'Rock, paper, scissors match against your computer cam?! ',
      details: "Collected hand gesture data using OpenCV and MediaPipe, then applied data augmentation techniques to increase the dataset to over 15000 lines. I used TensorFlow to train a model to classify the gestures, achieving over 96% accuracy. The model is integrated into a Flask web app that uses the webcam to play rock, paper, scissors against the user.",
      link: 'https://github.com/k2pereir/rockpaperscissors',
      status: 'Finished',
      technologies: ['TensorFlow, OpenCV, Python, Flask, MediaPipe'],
      timeline: 'December 2024',
      teamSize: 'Solo Project',
    },
    {
      id: 3,
      name: 'Class Profile',
      color: '#FFF0F5',
      description: "A snapshot of MGTE \'29",
      details: 'Collaborated with classmates to create a web application as a snapshot of our cohort\'s demographics, backgrounds, experiences, and interests. The project involved data collection, front-end and back-end development, and deployment using React and Node.js. I was responsible for helping out with front-end development and deployment.',
      link: 'https://github.com/hwtrs/mgte-29-class-profile/tree/main',
      status: 'In progress',
      technologies: ['React, Node.js, SCSS'],
      timeline: 'Sept 2025 - Current',
      teamSize: 'Team of 15+ people',
    },
    {
      id: 4,
      name: 'Music Tech',
      color: '#FFF5EE',
      description: 'A music recording app',
      details: 'Developing a music recording app to record, edit, and layer tracks using JUCE',
      link: 'https://github.com/k2pereir/juce',
      status: 'In progress',
      technologies: ['JUCE, C++'],
      timeline: 'August 2025 - Current',
      teamSize: 'Solo Project',
    },
    {
      id: 5,
      name: 'Sign Quest',
      color: '#F8F4FF',
      description: 'A sign language learning app',
      details: "Used OpenCV and MediaPipe to collect hand gesture data, then created a web app to detect user movements and match them to known sign language gestures, providing real-time feedback to help users learn sign language.",
      link: 'https://github.com/ohi-711/jamhacks8project',
      status: 'Finished',
      technologies: ['OpenCV, MediaPipe, Python'],
      timeline: 'June 2024',
      teamSize: 'Team of 4',
    },
    {
      id: 6,
      name: 'Sewstainability',
      color: '#FFFAFA',
      description: "An online closet web app",
      details: "Developed a platform for users to upload images of their clothing, track their clothing reuse, and sell/buy clothing on an online thirft store. We used Streamlit for the front-end and looked into incorporating OpenCV for image processing and adding an user authentication system. ",
      link: 'https://github.com/k2pereir/technova_project',
      status: 'Completed',
      technologies: ['Streamlit, Python'],
      timeline: 'September 2024',
      teamSize: 'Team of 3',
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
            <span>Kaelyn's Projects</span>
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
            <div className="sheet-header" style={{ backgroundColor: selectedFile.color}}>
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