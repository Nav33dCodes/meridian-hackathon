import React from 'react';
import { motion } from 'framer-motion';

export function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-elevated/80 backdrop-blur-md border border-subtle rounded-xl p-4 flex flex-col gap-3 hover:border-default hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
    >
      {/* Background subtle gradient for glassmorphism */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
           style={{ background: `radial-gradient(circle at top right, ${color}10, transparent 70%)` }} />
           
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}20` }}>
        <Icon size={15} color={color} />
      </div>
      <div className="relative z-10">
        <p className="text-[11px] font-semibold text-tertiary uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-primary leading-none group-hover:text-transparent group-hover:bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, var(--text-primary), ${color})` }}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-secondary mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}
