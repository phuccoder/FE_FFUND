import React from 'react';
import PropTypes from 'prop-types';

/**
 * Navigation component for project creation process with conditional section access
 * @param {Object} props - Component props
 * @param {Array<{id: string, name: string}>} props.sections - Array of section objects
 * @param {number} props.currentSection - Index of current active section
 * @param {Function} props.onSectionChange - Callback when section changes
 * @param {Object} props.formData - Form data to check completion status
 * @param {boolean} props.isEditMode - Whether component is in edit mode
 * @returns {JSX.Element} Navigation component
 */
export default function ProjectCreationNavigation({
  sections,
  currentSection,
  onSectionChange,
  formData,
  isEditMode = false
}) {
  // Check if terms are agreed to
  const isTermsComplete = Boolean(formData?.termsAgreed);

  // Check if basic info is complete
  const isBasicInfoComplete = () => {
    const basicInfo = formData?.basicInfo || {};
    const categoryValue = basicInfo.category || basicInfo.categoryId;
    const subCategoryValue = basicInfo.subCategory || (basicInfo.subCategoryIds && basicInfo.subCategoryIds.length > 0);

    return Boolean(
      basicInfo.title &&
      categoryValue &&
      subCategoryValue &&
      (basicInfo.shortDescription || basicInfo.projectDescription) 
    );
  };

  // Determine which sections are accessible - for edit mode always allow access to all sections
  const canAccessLaterSections = isEditMode || (isTermsComplete && isBasicInfoComplete());

  // Use the provided sections directly - DO NOT add additional sections
  const displaySections = sections || [];

  return (
    <div className="border-b border-gray-200 mb-4">
      <nav className="flex overflow-x-auto pb-2">
        {displaySections.map((section, index) => {
          // Check if this section should be disabled - in edit mode, no sections are disabled
          const isDisabled = !isEditMode && index > 1 && !canAccessLaterSections;

          return (
            <button
              key={section.id}
              onClick={() => !isDisabled && onSectionChange(index)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium mr-2 rounded-t-lg transition-all duration-200
                ${currentSection === index
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : isDisabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              disabled={isDisabled}
              title={
                isDisabled
                  ? "Complete Rules & Terms and Basic Information sections first"
                  : `Go to ${section.name}`
              }
            >
              <div className="flex items-center">
                {index + 1}. {section.name}
                {isDisabled && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Display a helpful message when sections are locked - only in create mode */}
      {!isEditMode && !canAccessLaterSections && currentSection <= 1 && (
        <div className="flex items-center mt-2 mb-1 text-sm text-amber-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Complete the Rules & Terms and Basic Information sections to unlock the rest of the form.
        </div>
      )}
    </div>
  );
}

// Add prop type validation
ProjectCreationNavigation.propTypes = {
  sections: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  currentSection: PropTypes.number.isRequired,
  onSectionChange: PropTypes.func.isRequired,
  formData: PropTypes.object,
  isEditMode: PropTypes.bool
};

// Default props
ProjectCreationNavigation.defaultProps = {
  formData: {},
  isEditMode: false
};