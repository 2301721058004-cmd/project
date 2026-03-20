import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { HelpCircle, ChevronDown } from 'lucide-react';

export function SupervisorFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How do I upload images or videos for detection?',
      answer: 'Go to the Detection section, click "Select File" or drag and drop an image or video. Choose your assigned zone from the dropdown, then click "Detect Helmets". The AI will analyze the file and show results within seconds.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'The system supports common image formats (JPG, PNG, etc.) and video formats (MP4, AVI, MOV, etc.). Maximum file size is 500MB. For best results, ensure good lighting and clear visibility of workers.'
    },
    {
      question: 'How are violations reported?',
      answer: 'When the system detects violations, they are automatically recorded with timestamps and images. You can view them in the History section with full details about the violation location and the workers involved.'
    },
    {
      question: 'Can I see violation history?',
      answer: 'Yes, the History section shows all violations detected in your assigned zones. You can filter by date, zone, and other criteria. Each violation includes a timestamp, images, and detailed information.'
    },
    {
      question: 'How do I manage my assigned zones?',
      answer: 'Visit the "My Zones" section to see all zones assigned to you by your admin. You can view zone details, assigned cameras, and access violation records for each zone.'
    },
    {
      question: 'What does the Gallery section show?',
      answer: 'The Gallery shows all images and videos you\'ve uploaded along with their detection results. You can organize them by date, zone, or violation status for easy reference.'
    },
    {
      question: 'How long are detection results stored?',
      answer: 'Detection results and violation history are stored indefinitely on our secure servers unless your admin deletes them. You can export historical data anytime for your records.'
    },
    {
      question: 'Can I share reports with my admin?',
      answer: 'Yes, your admin can see all violations and reports from your assigned zones in their dashboard. Additionally, you can export reports in PDF or CSV format and share them separately.'
    },
    {
      question: 'What should I do if I see a false positive?',
      answer: 'If the system incorrectly flags a violation, you can report it. This helps improve the AI model. Contact your admin or support team with details about the false positive.'
    },
    {
      question: 'How do I reset my password?',
      answer: 'Go to Settings and look for the Security section. You can change your password anytime. If you forget your password, use the "Forgot Password" option on the login page to reset it via email.'
    }
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
          <p className="text-gray-600">Find answers to common questions about monitoring your construction sites</p>
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

        {/* Still Need Help */}
        <div className="mt-12 p-8 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Still Need Help?</h2>
          <p className="text-gray-700 mb-6">
            Contact your site administrator or our support team for additional assistance.
          </p>
          <div className="flex gap-4">
            <a href="#" className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold">
              Contact Support
            </a>
            <a href="#" className="px-6 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-white transition font-semibold">
              View Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
