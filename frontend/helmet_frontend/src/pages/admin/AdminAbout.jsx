import React from 'react';
import { Card } from '../../components/ui/Card';
import { Info, Shield, Users, Zap, Globe, Upload, AlertCircle, TrendingUp, Database } from 'lucide-react';

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
              <h2 className="text-2xl font-bold text-gray-800 mb-3">System Workflow</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Our Safety Helmet Detection System operates in a seamless workflow designed for maximum efficiency and safety compliance. Here's how the system works:
              </p>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div>
                  <div className="flex gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200 mb-2">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-orange-600 text-white font-bold">1</div>
                    </div>
                    <h3 className="font-semibold text-gray-800">📤 Upload Media</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-14">
                    Upload image or video files through the "Test Detection by Camera" interface. Select the appropriate camera and zone, then drag-and-drop or browse to select your file.
                  </p>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="flex gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-2">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-600 text-white font-bold">2</div>
                    </div>
                    <h3 className="font-semibold text-gray-800">🧠 AI Detection Processing</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-14">
                    The YOLOv8 deep learning model analyzes the uploaded media to detect people and identify whether they're wearing helmets. System processes frames efficiently with smart frame-skipping for videos.
                  </p>
                </div>

                {/* Step 3 */}
                <div>
                  <div className="flex gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200 mb-2">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-600 text-white font-bold">3</div>
                    </div>
                    <h3 className="font-semibold text-gray-800">🖼️ Result Display & Annotation</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-14">
                    System returns a single annotated image highlighting detection results. For videos, the frame with the most violations is extracted. Violations are marked in red, safe detections in green.
                  </p>
                </div>

                {/* Step 4 */}
                <div>
                  <div className="flex gap-4 p-4 bg-red-50 rounded-lg border border-red-200 mb-2">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-600 text-white font-bold">4</div>
                    </div>
                    <h3 className="font-semibold text-gray-800">🔊 Violation Alert Sound</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-14">
                    If violations are detected, a distinctive 3-beep warning sound automatically plays for immediate operator awareness. Safe detections silence and display green status.
                  </p>
                </div>

                {/* Step 5 */}
                <div>
                  <div className="flex gap-4 p-4 bg-green-50 rounded-lg border border-green-200 mb-2">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-600 text-white font-bold">5</div>
                    </div>
                    <h3 className="font-semibold text-gray-800">💾 Data Storage & Tracking</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-14">
                    Detection results are stored in the database with annotated images. Statistics are recorded per camera, zone, and day for comprehensive historical tracking.
                  </p>
                </div>

                {/* Step 6 */}
                <div>
                  <div className="flex gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200 mb-2">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-600 text-white font-bold">6</div>
                    </div>
                    <h3 className="font-semibold text-gray-800">📊 Analytics & Reports</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-14">
                    Access comprehensive daily violation reports showing day-wise breakdown with bar charts, trend analysis, and statistics. Filter by zone and date range for detailed insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
