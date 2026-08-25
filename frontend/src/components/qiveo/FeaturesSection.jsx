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

        <Reveal>
          <div className="relative overflow-hidden w-full flex items-center py-6">
            <div className="flex w-max animate-marquee gap-6 hover:[animation-play-state:paused]">
              {[...FEATURES, ...FEATURES].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={i} className="group w-[300px] sm:w-[350px] shrink-0 h-full">
                    <div className="border-2 border-[#92400E] rounded-3xl bg-[#24201A] p-8 h-full relative shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all duration-300 group-hover:-translate-y-1">
                      <div className="w-12 h-12 bg-[#000000] border-2 border-[#92400E] rounded-xl flex items-center justify-center text-[#F5C542] mb-6">
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
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
