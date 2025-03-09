import React from 'react';

/**
 * Navigation component for project creation process
 * @param {Object} props - Component props
 * @param {Array<{id: string, name: string}>} props.sections - Array of section objects
 * @param {number} props.currentSection - Index of current active section
 * @param {Function} props.onSectionChange - Callback when section changes
 * @returns {JSX.Element} Navigation component
 */
export default function ProjectCreationNavigation({
  sections,
  currentSection,
  onSectionChange
}) {
  return (
    <div className="border-b border-gray-200 mb-4">
      <nav className="flex overflow-x-auto pb-2">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(index)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium mr-2 rounded-t-lg ${
              currentSection === index
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {index + 1}. {section.name}
          </button>
        ))}
      </nav>
    </div>
  );
}