import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible';
import { ChevronDown } from 'lucide-react';

const faqItems = [
  {
    question: 'Who is ChravelApp for?',
    answer:
      'Anyone organizing a group — work, sports, tours, conferences, vacations, or local events.',
  },
  {
    question: 'Why not just use the apps I already have?',
    answer:
      "Your texts don't know what's in your calendar. Your spreadsheet doesn't know what's in your group chat. ChravelApp's 8 tabs are fully interconnected — one trip brain instead of 8 disconnected apps.",
  },
  {
    question: 'What happens when I hit my 3-trip limit?',
    answer:
      "You'll need to delete an old trip to create a new one. Or upgrade to Explorer to keep unlimited trips!",
  },
  {
    question: 'How do AI queries work on each plan?',
    answer:
      'Free: 10 AI queries per user per trip. Explorer: 25. Frequent Chraveler: unlimited. Voice sessions count as one query. Each new trip resets your limit.',
  },
  {
    question: 'Can I change plans anytime?',
    answer: 'Yes! Upgrade, downgrade, or cancel anytime. No contracts, no hassles.',
  },
  {
    question: 'Is my data safe?',
    answer: 'All data is encrypted in transit and at rest. Row-level security ensures you only see trips you belong to. High Privacy mode adds end-to-end encryption for messages. Your trips are private unless you choose to share them.',
  },
  {
    question: 'Do all trip members need to pay?',
    answer:
      'Trips are free with limited features. Upgrade for unlimited trips and more. For Pro, only the admin pays and assigns seats — ideal for teams.',
  },
  {
    question: "What's included with the free Pro Trip and Event?",
    answer:
      'Every account gets 1 free Pro trip and 1 free Event — try all premium features, no commitment.',
  },
  {
    question: 'Are Events included in my subscription?',
    answer:
      'Yes — bundled into all paid plans. Explorer: up to 50 guests per event. Frequent Chraveler: up to 100 guests per event. Pro tiers: unlimited events (up to 100 guests each).',
  },
];
export const FAQSection = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 tablet:py-16 flex flex-col items-center justify-start tablet:justify-center min-h-0 tablet:min-h-screen space-y-8 tablet:space-y-12">
      {/* Header with bold white text and shadow for contrast */}
      <div className="text-center space-y-4 max-w-4xl">
        <h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)' }}
        >
          Frequently Asked Questions
        </h2>
        <p
          className="text-xl sm:text-2xl md:text-3xl text-white font-bold"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)' }}
        >
          Got questions? We've got answers.
        </p>
      </div>

      {/* FAQ Items */}
      <div className="w-full max-w-3xl space-y-4">
        {faqItems.map((item, index) => (
          <Collapsible
            key={index}
            open={openFaq === index}
            onOpenChange={open => setOpenFaq(open ? index : null)}
          >
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300">
              <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-card/30 transition-colors">
                <span className="font-semibold text-lg tablet:text-xl text-foreground pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-primary transition-transform duration-200 flex-shrink-0 ${
                    openFaq === index ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-4 pt-2 text-base tablet:text-lg text-foreground leading-relaxed">
                  {item.answer}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};
