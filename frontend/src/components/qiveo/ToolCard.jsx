import { Link } from 'react-router-dom';

export function ToolCard({ tool }) {
  const Icon = tool.icon;
  
  return (
    <Link 
      to={tool.route}
      className="group bg-[#171512] border border-[#92400E] rounded-3xl p-6 flex flex-col hover:bg-[#24201A] hover:border-[#F5C542] transition-colors"
    >
      <div className="w-12 h-12 bg-[#24201A] group-hover:bg-[#F5C542] rounded-xl flex items-center justify-center mb-4 transition-colors">
        <Icon className="w-6 h-6 text-[#F5C542] group-hover:text-[#171512] transition-colors" />
      </div>
      <h3 className="text-[#FFF8E1] font-heading font-black text-xl mb-2">{tool.name}</h3>
      <p className="text-[#FFF8E1]/60 font-mono text-sm leading-relaxed">{tool.description}</p>
    </Link>
  );
}
