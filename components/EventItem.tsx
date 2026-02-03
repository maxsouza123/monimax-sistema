
import React from 'react';
import { SecurityEvent, AlertSeverity } from '../types';

interface EventItemProps {
  event: SecurityEvent;
  onClick: (e: SecurityEvent) => void;
  active?: boolean;
}

const EventItem: React.FC<EventItemProps> = ({ event, onClick, active }) => {
  const severityBorders = {
    [AlertSeverity.CRITICAL]: 'border-red-500',
    [AlertSeverity.WARNING]: 'border-yellow-500',
    [AlertSeverity.INFO]: 'border-primary'
  };

  const severityText = {
    [AlertSeverity.CRITICAL]: 'text-red-500',
    [AlertSeverity.WARNING]: 'text-yellow-500',
    [AlertSeverity.INFO]: 'text-primary'
  };

  return (
    <div 
      onClick={() => onClick(event)}
      className={`bg-card-dark border border-border-dark border-l-4 ${severityBorders[event.severity]} rounded-lg p-3 cursor-pointer transition-all hover:bg-white/5 active:scale-[0.98] ${active ? 'ring-2 ring-primary/50' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[10px] font-bold ${severityText[event.severity]} uppercase tracking-wider`}>
          {event.severity}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">{event.timestamp}</span>
      </div>
      <div className="flex gap-3">
        {event.image && (
          <div 
            className="w-16 h-10 bg-center bg-cover rounded shrink-0 border border-border-dark"
            style={{ backgroundImage: `url(${event.image})` }}
          />
        )}
        <div className="flex flex-col min-w-0">
          <p className="text-white text-xs font-bold truncate">{event.location}</p>
          <p className="text-slate-400 text-[10px] truncate">{event.description}</p>
        </div>
      </div>
    </div>
  );
};

export default EventItem;
