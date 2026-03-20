import React from 'react';
import { Card } from '../../components/ui/Card';
import { Info, Shield, Users, Zap, Globe } from 'lucide-react';

export function AdminAbout() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Info className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-800">About Safety Helmet Detection</h1>
          </div>
          <p className="text-gray-600">Learn more about our system and mission</p>
        </div>

        {/* Main About Section */}
        <Card className="mb-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                Safety Helmet Detection System is dedicated to creating safer construction environments through advanced AI technology. We combine cutting-edge computer vision with real-time monitoring to ensure workplace safety compliance and protect construction workers from preventable accidents.
              </p>
            </div>

            <div className="h-px bg-gray-200"></div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Core Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-4">
                  <Zap className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">AI-Powered Detection</h3>
                    <p className="text-sm text-gray-600">YOLOv8 deep learning model with 99% accuracy for helmet detection</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Shield className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Enterprise Security</h3>
                    <p className="text-sm text-gray-600">Encrypted data storage and secure session management</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Users className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Role-Based Access</h3>
                    <p className="text-sm text-gray-600">Separate dashboards for Admins and Supervisors</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Globe className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">24/7 Monitoring</h3>
                    <p className="text-sm text-gray-600">Continuous site monitoring with real-time alert system</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200"></div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Version & Support</h2>
              <div className="grid md:grid-cols-2 gap-4 text-gray-600">
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Current Version</p>
                  <p>v1.2.4 Premium</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-1">Release Date</p>
                  <p>March 2026</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200"></div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Get Help</h2>
              <p className="text-gray-600 mb-3">
                For support, technical issues, or feature requests, please contact our support team or visit our help center.
              </p>
              <div className="flex gap-3">
                <a href="#" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                  Contact Support
                </a>
                <a href="#" className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition">
                  View Documentation
                </a>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
