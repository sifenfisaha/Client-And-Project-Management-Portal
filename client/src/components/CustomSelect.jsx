import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const selectedIndex = options.findIndex((option) => option === value);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }

    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, selectedIndex]);

  const selectOption = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (!isOpen && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!isOpen && event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next >= options.length ? 0 : next;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? options.length - 1 : next;
      });
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (highlightedIndex >= 0 && options[highlightedIndex]) {
        selectOption(options[highlightedIndex]);
      }
    }
  };

  const triggerClasses = `w-full bg-white/5 border ${
    hasError ? 'border-red-500' : 'border-white/10 hover:border-white/30'
  } rounded-xl px-4 py-3 pr-10 text-left text-sm sm:text-base text-gray-200 focus:outline-none focus:border-[#14A3F6] transition-all`;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={triggerClasses}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
      >
        <span
          className={`block leading-snug wrap-break-word ${
            value ? 'text-white' : 'text-gray-300'
          }`}
        >
          {value || placeholder}
        </span>
      </button>

      <ChevronDown
        className={`w-4 h-4 text-gray-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`}
      />

      {isOpen && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute z-30 mt-2 w-full max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0b0b0b] shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
        >
          {options.map((option, index) => {
            const isSelected = value === option;
            const isHighlighted = highlightedIndex === index;

            return (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full px-4 py-2.5 text-left text-sm sm:text-base whitespace-normal wrap-break-word transition-colors ${
                    isHighlighted
                      ? 'bg-[#14A3F6]/20 text-white'
                      : isSelected
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
