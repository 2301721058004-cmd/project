import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { HelpCircle, ChevronDown } from 'lucide-react';

export function AdminFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How does the AI helmet detection system work?',
      answer: 'Our system uses YOLOv8, a state-of-the-art deep learning model trained to detect safety helmets. It analyzes images and videos in real-time to identify workers and determine if they are wearing helmets. The system achieved 99% accuracy in controlled tests.'
    },
    {
      question: 'How many cameras can I connect to the system?',
      answer: 'There is no limit to the number of cameras you can connect. You can organize them into different zones for better management. Each zone can have multiple cameras, and supervisors can be assigned to monitor specific zones.'
    },
    {
      question: 'What file formats are supported for upload?',
      answer: 'The system supports both image and video files. For images: JPG, PNG, and other common formats. For videos: MP4, AVI, MOV, and other common video formats. Maximum file size is 500MB.'
    },
    {
      question: 'How are violations recorded and stored?',
      answer: 'All detected violations are automatically recorded with timestamps, location (zone), and images/video frames showing the violation. This data is securely stored and can be accessed through the violation history dashboard for compliance reporting.'
    },
    {
      question: 'Can I assign multiple supervisors to a zone?',
      answer: 'Yes, you can assign multiple supervisors to oversee a single zone. Each supervisor will have access to all data related to that zone, including real-time alerts and historical violation logs.'
    },
    {
      question: 'How do I reset a supervisor password?',
      answer: 'Go to the Supervisors section in your admin dashboard, find the supervisor you want to manage, and click the reset button. A temporary password can be generated and shared with the supervisor through your preferred communication channel.'
    },

  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-800">Frequently Asked Questions</h1>
          </div>
          <p className="text-gray-600">Find answers to common questions about the Safety Helmet Detection System</p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 hover:bg-orange-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800 text-left">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-orange-600 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 pb-6 border-t border-gray-200 bg-gray-50">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
