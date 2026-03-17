import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export function About() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-center">About Safety Helmet Detection</h1>
        
        <div className="bg-white shadow-md rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Project Overview</h2>
          <p className="text-gray-700 mb-4">
            Our Safety Helmet Detection System uses advanced YOLOv8 AI technology to monitor 
            construction sites and ensure worker safety compliance. The system automatically 
            detects when workers are not wearing proper safety helmets and sends real-time 
            alerts to supervisors.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Real-time image analysis using YOLOv8</li>
            <li>Role-based access control (Admin & Supervisor)</li>
            <li>Zone and camera management</li>
            <li>Violation history and analytics</li>
            <li>Audio alerts for immediate notification</li>
            <li>Secure session-based authentication</li>
          </ul>
        </div>

        <div className="text-center">
          <Link to="/features">
            <Button variant="primary" size="lg">View All Features</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}