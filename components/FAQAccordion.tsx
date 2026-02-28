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
    <section className="px-6 py-20 bg-gradient-to-b from-white to-slate-50 dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <h2 className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {title}
            </h2>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
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
                  bg-white dark:bg-gray-800/80 rounded-2xl shadow-lg border transition-all duration-300
                  ${isOpen 
                    ? 'border-purple-200 dark:border-purple-700/50 shadow-purple-100/50 dark:shadow-purple-900/20' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-purple-100 dark:hover:border-purple-800'
                  }
                `}
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-6 text-left flex items-center justify-between group"
                >
                  <h3 className={`
                    text-lg font-bold pr-4 transition-colors duration-300
                    ${isOpen ? 'text-purple-700 dark:text-purple-400' : 'text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400'}
                  `}>
                    {item.question}
                  </h3>
                  <div className={`
                    flex-shrink-0 p-2 rounded-full transition-all duration-300
                    ${isOpen 
                      ? 'bg-purple-100 dark:bg-purple-900/50 rotate-180' 
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/30'
                    }
                  `}>
                    <ChevronDown className={`
                      h-5 w-5 transition-colors duration-300
                      ${isOpen ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}
                    `} />
                  </div>
                </button>
                
                {/* Animated Answer */}
                <div className={`
                  overflow-hidden transition-all duration-500 ease-in-out
                  ${isOpen ? 'max-h-96' : 'max-h-0'}
                `}>
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
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
        <div className="mt-12 text-center p-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl border border-purple-100 dark:border-purple-800/50">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
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
              className="px-6 py-3 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-medium border border-purple-200 dark:border-purple-700"
            >
              View Documentation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}