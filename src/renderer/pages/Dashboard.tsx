import React from 'react';
import MatrixVisualization from '../components/MatrixVisualization';

const Dashboard: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-black">
      <MatrixVisualization 
        width={window.innerWidth - 280} 
        height={window.innerHeight}
      />
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center">
        <h1 className="text-4xl font-bold text-green-400 font-mono mb-2">WEAVE TOOL</h1>
        <p className="text-green-300 font-mono">AI-Powered Terminal Data Analysis</p>
      </div>
    </div>
  );
};

export default Dashboard; 