import React from 'react';

export default function ProjectCreationChecklist({ formData = {}, sections }) {
    const calculateSectionCompletion = (section) => {
      // Ensure formData exists
      const data = formData || {};
      
      switch (section) {
        case 'terms':
          return data.termsAgreed ? 100 : 0;
        
        case 'basic': {
          const basicInfo = data.basicInfo || {};
          const { title, category, shortDescription } = basicInfo;
          let completed = 0;
          let total = 3; // Required fields: title, category, shortDescription
          
          if (title) completed++;
          if (category) completed++;
          if (shortDescription) completed++;
          
          return Math.round((completed / total) * 100);
        }
        
        case 'fundraising': {
          const fundraisingInfo = data.fundraisingInfo || {};
          const phases = fundraisingInfo.phases || [];
          
          if (!phases.length) {
            return 0;
          }
          
          let completedPhaseFields = 0;
          let totalPhaseFields = 0;
          
          phases.forEach(phase => {
            if (!phase) return;
            const requiredFields = ['name', 'fundingGoal', 'startDate', 'duration'];
            requiredFields.forEach(field => {
              totalPhaseFields++;
              if (phase[field]) completedPhaseFields++;
            });
          });
          
          // Add overall campaign start date
          totalPhaseFields++;
          if (fundraisingInfo.startDate) completedPhaseFields++;
          
          return totalPhaseFields > 0 ? Math.round((completedPhaseFields / totalPhaseFields) * 100) : 0;
        }
        
        case 'rewards': {
          const fundraisingInfo = data.fundraisingInfo || {};
          const phases = fundraisingInfo.phases || [];
          const rewards = data.rewardInfo || [];
          
          if (!rewards.length || !phases.length) {
            return 0;
          }
          
          const phaseIds = phases
            .filter(phase => phase && phase.id)
            .map(phase => phase.id);
            
          if (phaseIds.length === 0) return 0;
            
          const phasesWithRewards = new Set(
            rewards
              .filter(reward => reward && reward.phaseId)
              .map(reward => reward.phaseId)
          );
          
          const phaseCoverage = phaseIds.filter(id => phasesWithRewards.has(id)).length / phaseIds.length;
          
          // Check for complete reward fields
          let completedRewardFields = 0;
          let totalRewardFields = 0;
          
          rewards.forEach(reward => {
            if (!reward) return;
            const requiredFields = ['title', 'description', 'amount', 'estimatedDelivery', 'phaseId'];
            requiredFields.forEach(field => {
              totalRewardFields++;
              if (reward[field]) completedRewardFields++;
            });
          });
          
          const fieldCompletion = totalRewardFields > 0 ? completedRewardFields / totalRewardFields : 0;
          
          return Math.round(((phaseCoverage + fieldCompletion) / 2) * 100);
        }
        
        case 'story': {
          const story = data.projectStory || '';
          const storyLength = typeof story === 'string' ? story.length : 0;
          const recommendedLength = 500; // characters
          return Math.min(100, Math.round((storyLength / recommendedLength) * 100));
        }
        
        case 'founder': {
          const founderProfile = data.founderProfile || {};
          const { bio, experience, team, socialLinks } = founderProfile;
          let completed = 0;
          let total = 2; // Required fields: bio, experience
          
          if (bio) completed++;
          if (experience) completed++;
          
          // Bonus points for team members and social links
          if (team && Array.isArray(team) && team.length > 0) {
            completed += 0.5;
            total += 0.5;
          }
          
          if (socialLinks && typeof socialLinks === 'object') {
            const filledLinks = Object.values(socialLinks).filter(link => link).length;
            if (filledLinks > 0) {
              completed += 0.5;
              total += 0.5;
            }
          }
          
          return Math.round((completed / total) * 100);
        }
        
        case 'documents': {
          const requiredDocs = data.requiredDocuments || {};
          const mandatory = requiredDocs.mandatory || {};
          const optional = requiredDocs.optional || {};
          
          let completed = 0;
          let total = 6; // 5 mandatory docs + at least one project media
          
          if (mandatory.swotAnalysis) completed++;
          if (mandatory.businessModelCanvas) completed++;
          if (mandatory.businessPlan) completed++;
          if (mandatory.marketResearch) completed++;
          if (mandatory.financialInformation) completed++;
          
          const projectMedia = mandatory.projectMedia || [];
          if (Array.isArray(projectMedia) && projectMedia.length > 0) completed++;
          
          // Bonus points for optional documents
          const optionalTotal = 3;
          const optionalValues = typeof optional === 'object' ? Object.values(optional) : [];
          const optionalCompleted = optionalValues.filter(doc => doc).length;
          
          // Weigh optional documents less than mandatory ones
          completed += (optionalCompleted / optionalTotal) * 0.5;
          total += 0.5;
          
          return Math.round((completed / total) * 100);
        }
        
        case 'payment': {
          const paymentInfo = data.paymentInfo || {};
          const { accountName, accountNumber, bankName, swiftCode, country } = paymentInfo;
          let completed = 0;
          let total = 4; // Required fields: accountName, accountNumber, bankName, country
          
          if (accountName) completed++;
          if (accountNumber) completed++;
          if (bankName) completed++;
          if (country) completed++;
          
          // SWIFT code is optional
          if (swiftCode) {
            completed += 0.5;
            total += 0.5;
          }
          
          return Math.round((completed / total) * 100);
        }
        
        default:
          return 0;
      }
    };
  
    const isBasicInfoComplete = () => {
      const basicInfo = formData?.basicInfo || {};
      const { title, category, shortDescription } = basicInfo;
      return Boolean(title && category && shortDescription);
    };
  
    const isFundraisingInfoComplete = () => {
      // Check if at least one phase exists with required fields
      const fundraisingInfo = formData?.fundraisingInfo || {};
      const phases = fundraisingInfo.phases || [];
      
      return phases.length > 0 && 
             phases.every(phase => 
               phase && 
               phase.name && 
               phase.fundingGoal && 
               phase.startDate && 
               phase.duration
             );
    };
  
    const isRewardInfoComplete = () => {
      // Check if rewards exist
      const rewards = formData?.rewardInfo || [];
      const fundraisingInfo = formData?.fundraisingInfo || {};
      const phases = fundraisingInfo.phases || [];
      
      if (!rewards.length || !phases.length) return false;
      
      // Check if each phase has at least one reward
      const phaseIds = phases
        .filter(phase => phase && phase.id)
        .map(phase => phase.id);
      
      // Check if each phase has at least one reward
      return phaseIds.length > 0 && phaseIds.every(phaseId => 
        rewards.some(reward => reward && reward.phaseId === phaseId)
      );
    };
  
    const isProjectStoryComplete = () => {
      const story = formData?.projectStory || '';
      return typeof story === 'string' && story.length > 200;
    };
  
    const isFounderProfileComplete = () => {
      const founderProfile = formData?.founderProfile || {};
      const { bio, experience } = founderProfile;
      return Boolean(bio && experience);
    };
  
    const isRequiredDocumentsComplete = () => {
      const requiredDocs = formData?.requiredDocuments || {};
      const mandatory = requiredDocs.mandatory || {};
      const { 
        swotAnalysis, 
        businessModelCanvas, 
        businessPlan, 
        marketResearch, 
        financialInformation 
      } = mandatory;
      
      return Boolean(
        swotAnalysis && 
        businessModelCanvas && 
        businessPlan && 
        marketResearch && 
        financialInformation
      );
    };
  
    const isPaymentInfoComplete = () => {
      const paymentInfo = formData?.paymentInfo || {};
      const { accountName, accountNumber, bankName, country } = paymentInfo;
      return Boolean(accountName && accountNumber && bankName && country);
    };
  
    const checklistItems = [
      { 
        id: 'terms', 
        name: 'Rules & Terms', 
        isComplete: Boolean(formData?.termsAgreed), 
        completion: calculateSectionCompletion('terms') 
      },
      { 
        id: 'basic', 
        name: 'Basic Information', 
        isComplete: isBasicInfoComplete(), 
        completion: calculateSectionCompletion('basic') 
      },
      { 
        id: 'fundraising', 
        name: 'Fundraising Information', 
        isComplete: isFundraisingInfoComplete(), 
        completion: calculateSectionCompletion('fundraising') 
      },
      { 
        id: 'rewards', 
        name: 'Reward Information', 
        isComplete: isRewardInfoComplete(), 
        completion: calculateSectionCompletion('rewards') 
      },
      { 
        id: 'story', 
        name: 'Project Story', 
        isComplete: isProjectStoryComplete(), 
        completion: calculateSectionCompletion('story') 
      },
      { 
        id: 'founder', 
        name: 'Founder Profile', 
        isComplete: isFounderProfileComplete(), 
        completion: calculateSectionCompletion('founder') 
      },
      { 
        id: 'documents', 
        name: 'Required Documents', 
        isComplete: isRequiredDocumentsComplete(), 
        completion: calculateSectionCompletion('documents') 
      },
      { 
        id: 'payment', 
        name: 'Payment Information', 
        isComplete: isPaymentInfoComplete(), 
        completion: calculateSectionCompletion('payment') 
      },
    ];
  
    const completedSections = checklistItems.filter(item => item.isComplete).length;
    const totalProgress = checklistItems.reduce((sum, item) => sum + item.completion, 0) / checklistItems.length;
  
    // Check for phases without rewards
    const getPhasesMissingRewards = () => {
      const fundraisingInfo = formData?.fundraisingInfo || {};
      const phases = fundraisingInfo.phases || [];
      const rewards = formData?.rewardInfo || [];
      
      if (!phases.length || !rewards.length) return [];
      
      return phases
        .filter(phase => phase && phase.id)
        .filter(phase => !rewards.some(reward => reward && reward.phaseId === phase.id))
        .map(phase => phase.name || `Phase ${phase.id}`);
    };
  
    const phasesMissingRewards = getPhasesMissingRewards();
  
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Submission Checklist</h3>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Completion</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(totalProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${totalProgress}%` }}
            ></div>
          </div>
        </div>
        
        <ul className="space-y-5">
          {checklistItems.map((item, index) => (
            <li key={item.id} className="flex items-start group">
              <div className="flex-shrink-0 relative">
                {/* Circular progress indicator */}
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  {/* Background circle */}
                  <circle
                    className="text-gray-200"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="transparent"
                    r="10"
                    cx="12"
                    cy="12"
                  />
                  {/* Progress circle */}
                  <circle
                    className={`${item.completion === 100 ? 'text-green-500' : 'text-blue-500'}`}
                    strokeWidth="2"
                    strokeDasharray={`${item.completion * 0.628} 100`} // 2*PI*r = ~62.8
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="10"
                    cx="12"
                    cy="12"
                    transform="rotate(-90 12 12)"
                  />
                  {/* Center dot or checkmark */}
                  {item.isComplete ? (
                    <path
                      className="text-green-500 fill-current"
                      d="M9 12l2 2 4-4"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                    />
                  ) : (
                    <circle
                      className={`${item.completion > 0 ? 'text-blue-500' : 'text-gray-300'} fill-current`}
                      r="3"
                      cx="12"
                      cy="12"
                    />
                  )}
                </svg>
                
                {/* Percentage inside tooltip on hover */}
                <span className="absolute top-0 left-0 -mt-8 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.completion}%
                </span>
              </div>
              
              <div className="ml-3">
                <span className={`text-sm ${item.isComplete ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                  {index + 1}. {item.name}
                </span>
                <div className="mt-1 text-xs text-gray-500">
                  {item.completion}% complete
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        {phasesMissingRewards.length > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Missing Rewards</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The following phases don&apos;t have any rewards yet: {phasesMissingRewards.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {totalProgress === 100 && (
          <div className="mt-6 bg-green-50 border border-green-100 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">All Set!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your project is ready for submission. Click the Submit button to proceed.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700">Submission Requirements</h4>
          <ul className="mt-2 space-y-1 text-xs text-gray-500 list-disc pl-5">
            <li>All sections must be 100% complete before submission</li>
            <li>Each phase must have at least one associated reward</li>
            <li>All mandatory documents must be uploaded</li>
            <li>Payment information must be accurate and verified</li>
            <li>Project story should be comprehensive and well-formatted</li>
          </ul>
        </div>
      </div>
    );
}