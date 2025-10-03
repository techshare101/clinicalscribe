"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
}

export default function FAQAccordion({ 
  items, 
  title = "Frequently Asked Questions",
  subtitle = "Everything you need to know about ClinicalScribe"
}: FAQAccordionProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="px-6 py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <HelpCircle className="h-8 w-8 text-purple-600" />
            <h2 className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {title}
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const isOpen = openItems.includes(index);
            
            return (
              <div
                key={index}
                className={`
                  bg-white rounded-2xl shadow-lg border transition-all duration-300
                  ${isOpen 
                    ? 'border-purple-200 shadow-purple-100/50' 
                    : 'border-gray-100 hover:border-purple-100'
                  }
                `}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-6 text-left flex items-center justify-between group"
                >
                  <h3 className={`
                    text-lg font-bold pr-4 transition-colors duration-300
                    ${isOpen ? 'text-purple-700' : 'text-gray-900 group-hover:text-purple-600'}
                  `}>
                    {item.question}
                  </h3>
                  <div className={`
                    flex-shrink-0 p-2 rounded-full transition-all duration-300
                    ${isOpen 
                      ? 'bg-purple-100 rotate-180' 
                      : 'bg-gray-100 group-hover:bg-purple-50'
                    }
                  `}>
                    <ChevronDown className={`
                      h-5 w-5 transition-colors duration-300
                      ${isOpen ? 'text-purple-600' : 'text-gray-500'}
                    `} />
                  </div>
                </button>
                
                {/* Animated Answer */}
                <div className={`
                  overflow-hidden transition-all duration-500 ease-in-out
                  ${isOpen ? 'max-h-96' : 'max-h-0'}
                `}>
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
          <p className="text-lg text-gray-700 mb-4">
            Still have questions? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 font-medium"
            >
              Contact Support
            </a>
            <a
              href="/docs"
              className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium border border-purple-200"
            >
              View Documentation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}