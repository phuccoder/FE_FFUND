import React from 'react';

/**
 * Component to show editing restrictions based on project status and section
 * @param {Object} props Component props
 * @param {string} props.projectStatus Current project status
 * @param {string} props.section Current section being edited
 * @returns {JSX.Element} Notice component
 */
export default function EditRestrictionNotice({ projectStatus, section }) {
  // Check if current section has restrictions in current status
  const hasRestrictions = () => {
    if (projectStatus === 'FUNDRAISING') {
      if (section === 'fundraisingInfo' || section === 'rewardInfo') {
        return true;
      }
      
      if (section === 'requiredDocuments') {
        return { partial: true, message: "Financial documents cannot be edited during fundraising." };
      }
    }
    
    if (projectStatus === 'SUSPENDED' || projectStatus === 'CANCELLED') {
      return true;
    }
    
    return false;
  };
  
  const restrictions = hasRestrictions();
  
  if (!restrictions) return null;
  
  return (
    <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">Editing Restricted</h3>
          <div className="mt-1 text-sm text-amber-700">
            {projectStatus === 'FUNDRAISING' && section === 'fundraisingInfo' && (
              <p>You cannot edit fundraising information while your project is in the fundraising stage.</p>
            )}
            
            {projectStatus === 'FUNDRAISING' && section === 'rewardInfo' && (
              <p>You cannot edit rewards while your project is in the fundraising stage.</p>
            )}
            
            {projectStatus === 'FUNDRAISING' && section === 'requiredDocuments' && restrictions.partial && (
              <p>{restrictions.message}</p>
            )}
            
            {(projectStatus === 'SUSPENDED' || projectStatus === 'CANCELLED') && (
              <p>This project is {projectStatus === 'SUSPENDED' ? 'suspended' : 'cancelled'} and cannot be edited.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}