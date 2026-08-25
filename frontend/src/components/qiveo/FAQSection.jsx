import { useState } from "react";
import { FAQS } from "@/content/homeContent";
import { Reveal } from "@/components/qiveo/Reveal";
import { ChevronDown } from "lucide-react";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  if (!FAQS || FAQS.length === 0) return null;

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#FFF8E1] uppercase tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="font-mono text-sm text-[#FFF8E1]/65 uppercase tracking-widest">
              Got questions? We've got answers.
            </p>
          </div>
        </Reveal>

        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal key={faq.id} delay={i * 40}>
                <div className="border-2 border-[#92400E] rounded-2xl bg-[#24201A] overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C542] hover:bg-[#2D2A26] transition-colors"
                  >
                    <h3 className="font-heading font-extrabold text-[#FFF8E1] text-lg pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`w-5 h-5 text-[#F5C542] shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    id={`faq-answer-${faq.id}`}
                    className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 pt-2 font-mono text-sm text-[#FFF8E1]/70 leading-relaxed tracking-wide">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
