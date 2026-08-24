import { FEATURES } from "@/content/homeContent";
import { Reveal } from "@/components/qiveo/Reveal";

export function FeaturesSection() {
  if (!FEATURES || FEATURES.length === 0) return null;

  return (
    <section className="py-20 border-t-2 border-[#92400E]">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#FFF8E1] uppercase tracking-tight mb-4">
              Why Creators Choose Qiveo
            </h2>
            <p className="font-mono text-sm text-[#FFF8E1]/65 max-w-2xl mx-auto uppercase tracking-widest">
              Built from the ground up for developers and artists. We provide the tools you need to succeed.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.id} delay={i * 50}>
                <div className="group h-full">
                  <div className="border-2 border-[#92400E] rounded-3xl bg-[#24201A] p-8 h-full relative shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all duration-300 group-hover:-translate-y-1">
                    <div className="w-12 h-12 bg-[#171512] border-2 border-[#92400E] rounded-xl flex items-center justify-center text-[#F5C542] mb-6">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-heading font-extrabold text-xl text-[#FFF8E1] mb-3">
                      {feature.title}
                    </h3>
                    <p className="font-mono text-xs text-[#FFF8E1]/75 leading-relaxed tracking-wide">
                      {feature.description}
                    </p>
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
