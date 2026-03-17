import React from 'react';
import { Card } from '../../components/ui/Card';

export function Features() {
  const features = [
    {
      title: 'AI Detection',
      description: 'State-of-the-art YOLOv8 model for accurate helmet detection',
      icon: '🤖',
    },
    {
      title: 'Real-time Monitoring',
      description: 'Instant analysis and alert generation',
      icon: '⚡',
    },
    {
      title: 'Zone Management',
      description: 'Organize cameras and supervisors by construction zones',
      icon: '📍',
    },
    {
      title: 'Violation Tracking',
      description: 'Complete history of all safety violations',
      icon: '📋',
    },
    {
      title: 'Audio Alerts',
      description: 'Immediate sound notifications for supervisors',
      icon: '🔔',
    },
    {
      title: 'Secure Access',
      description: 'Role-based authentication and authorization',
      icon: '🔒',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">System Features</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}