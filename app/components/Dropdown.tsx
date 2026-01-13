'use client';

import { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select',
  id,
  className = '',
}: DropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id={id}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full px-4 py-2.5 pr-5 bg-[#212121] border border-[#424242] rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-[#BC4918] focus:border-transparent transition-all cursor-pointer flex items-center justify-between"
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isDropdownOpen && (
        <div className="absolute z-10 w-full mt-2 bg-[#212121] backdrop-blur-sm border border-[#424242] rounded-lg shadow-lg overflow-hidden">
          <div className="py-2 px-2 max-h-80 overflow-y-auto custom-scrollbar">
            {options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsDropdownOpen(false);
                }}
                className={`w-full py-2.5 text-left text-white hover:bg-[#2a2a2a] rounded transition-colors cursor-pointer flex items-center gap-3 ${
                  value ? 'pl-3 pr-4' : 'px-4'
                } ${value === option ? 'bg-[#2a2a2a]' : ''}`}
              >
                {value && (
                  <>
                    {value === option ? (
                      <svg 
                        className="w-5 h-5 text-[#BC4918] flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-5 h-5 flex-shrink-0" />
                    )}
                  </>
                )}
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
