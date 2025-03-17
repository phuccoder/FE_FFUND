import React from 'react';
import PropTypes from 'prop-types';

// Character limit constant
const MAX_STORY_CHARS = 5000;

export default function ProjectCreationChecklist({ formData = {}, sections }) {
  const calculateSectionCompletion = (section) => {
    // Ensure formData exists
    const data = formData || {};

    switch (section) {
      case 'terms':
        return data.termsAgreed ? 100 : 0;

      case 'basic': {
        // Check if data is structured with basicInfo or at the root level
        const basicInfo = data.basicInfo || data;

        // Extract values with proper fallbacks
        const categoryValue = basicInfo.categoryId || basicInfo.category || basicInfo.category_id;
        const locationValue = basicInfo.location || basicInfo.locationId || basicInfo.location_id;
        const subCategoryValue = basicInfo.subCategoryIds || basicInfo.subCategory || basicInfo.sub_category_ids;

        // Count completed fields - initialize to 0
        let completed = 0;
        const total = 9;

        // Check each field with improved value detection
        const checks = {
          title: !!basicInfo.title,
          category: !!(categoryValue && (
            (Array.isArray(categoryValue) && categoryValue.length > 0) ||
            (!Array.isArray(categoryValue) && categoryValue)
          )),
          subCategory: !!(subCategoryValue && (
            (Array.isArray(subCategoryValue) && subCategoryValue.length > 0) ||
            (!Array.isArray(subCategoryValue) && subCategoryValue)
          )),
          shortDescription: !!basicInfo.shortDescription,
          location: !!locationValue,
          projectUrl: !!basicInfo.projectUrl,
          mainSocialMediaUrl: !!basicInfo.mainSocialMediaUrl,
          projectVideoDemo: !!basicInfo.projectVideoDemo,
          // FIXED: Only count as complete if explicitly set by the user to true
          isClassPotential: basicInfo.isClassPotential === true
        };

        // Count completed fields
        Object.values(checks).forEach(value => {
          if (value) completed++;
        });
        const allFieldsComplete = Object.values(checks).every(Boolean);
        const percentage = allFieldsComplete ? 100 : Math.round((completed / total) * 100);
        return percentage;
      }

      // Modified section to handle simplified funding phases structure

      // In the calculateSectionCompletion function, modify the fundraising case:
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
          const requiredFields = ['fundingGoal', 'startDate', 'duration'];
          requiredFields.forEach(field => {
            totalPhaseFields++;
            if (phase[field]) completedPhaseFields++;
          });
        });

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

          // Required fields validation
          const requiredFields = ['title', 'description', 'amount', 'estimatedDelivery', 'phaseId'];
          requiredFields.forEach(field => {
            totalRewardFields++;
            if (reward[field]) completedRewardFields++;
          });

          // Check for items with names and images
          if (Array.isArray(reward.items) && reward.items.length > 0) {
            reward.items.forEach(item => {
              // Item name is required
              totalRewardFields++;
              if (item && item.name) completedRewardFields++;

              // Image is optional but gives bonus points
              if (item && item.image) {
                completedRewardFields += 0.5;
                totalRewardFields += 0.5;
              }
            });
          }
        });

        const fieldCompletion = totalRewardFields > 0 ? completedRewardFields / totalRewardFields : 0;

        // Combine phase coverage (50%) and field completion (50%)
        return Math.round(((phaseCoverage + fieldCompletion) / 2) * 100);
      }

      case 'story': {
        // Enhanced project story evaluation with content blocks analysis
        const story = data.projectStory || '';

        // If no story content, return 0
        if (!story || typeof story !== 'string' || story.trim().length === 0) {
          return 0;
        }

        // Parse the HTML content to analyze structure and elements
        const parseAndAnalyzeStory = () => {
          try {
            if (typeof window === 'undefined') {
              // Server-side rendering fallback
              const storyLength = story.length;
              // Basic length check - adjusted for 5000 character limit
              if (storyLength > 3000) return 80;
              if (storyLength > 1500) return 50;
              if (storyLength > 500) return 30;
              return 10;
            }

            // Client-side rich analysis
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = story;

            // Extract plain text
            const plainText = tempDiv.textContent || '';
            const charCount = plainText.length;
            const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;

            // Check if over character limit
            if (charCount > MAX_STORY_CHARS) {
              return Math.max(10, 70 - Math.min(30, Math.floor((charCount - MAX_STORY_CHARS) / 100)));
            }

            // Count different elements
            const images = tempDiv.querySelectorAll('img').length;
            const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
            const paragraphs = tempDiv.querySelectorAll('p').length;
            const lists = tempDiv.querySelectorAll('ul, ol').length;
            const videos = tempDiv.querySelectorAll('.ProseMirror-youtube-iframe, iframe').length;
            const links = tempDiv.querySelectorAll('a').length;

            // Calculate base score from content length
            let score = 0;

            // Character count scoring (max: 40 points) - adjusted for 5000 limit
            if (charCount > 3000) score += 40;
            else if (charCount > 1500) score += 30;
            else if (charCount > 800) score += 20;
            else if (charCount > 300) score += 10;
            else score += 5;

            // Content variety scoring (max: 60 points)
            if (headings > 0) score += Math.min(headings * 5, 15); // Up to 15 points for headings
            if (images > 0) score += Math.min(images * 5, 20); // Up to 20 points for images
            if (paragraphs > 2) score += Math.min((paragraphs - 2) * 2, 10); // Up to 10 points for paragraphs
            if (lists > 0) score += Math.min(lists * 3, 9); // Up to 9 points for lists
            if (videos > 0) score += Math.min(videos * 3, 6); // Up to 6 points for videos

            return Math.min(score, 100);
          } catch (error) {
            console.error('Error analyzing story content:', error);
            // Fallback to basic length check
            const storyLength = story.length;
            if (storyLength > 3000) return 70;
            if (storyLength > 1500) return 40;
            if (storyLength > 500) return 20;
            return 10;
          }
        };

        return parseAndAnalyzeStory();
      }

      // Other sections remain unchanged
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
    // Check if data is structured with basicInfo or directly at the root level
    const basicInfo = formData?.basicInfo || formData;

    // UPDATED: Check for the specific field names used by BasicInformation.js first
    const categoryValue = basicInfo.categoryId || basicInfo.category || basicInfo.category_id;
    const locationValue = basicInfo.location || basicInfo.locationId || basicInfo.location_id;
    const subCategoryValue = basicInfo.subCategoryIds || basicInfo.subCategory || basicInfo.sub_category_ids;

    // Explicitly check each field
    const checks = {
      title: !!basicInfo.title,
      category: !!(categoryValue && (
        (Array.isArray(categoryValue) && categoryValue.length > 0) ||
        (!Array.isArray(categoryValue) && categoryValue)
      )),
      subCategory: !!(subCategoryValue && (
        (Array.isArray(subCategoryValue) && subCategoryValue.length > 0) ||
        (!Array.isArray(subCategoryValue) && subCategoryValue)
      )),
      shortDescription: !!basicInfo.shortDescription,
      location: !!locationValue,
      projectUrl: !!basicInfo.projectUrl,
      mainSocialMediaUrl: !!basicInfo.mainSocialMediaUrl,
      projectVideoDemo: !!basicInfo.projectVideoDemo,

      isClassPotential: basicInfo.isClassPotential === true || basicInfo.isClassPotential === false
    };

    return Object.values(checks).every(Boolean);
  };


  const isFundraisingInfoComplete = () => {
    // Check if at least one phase exists with required fields
    const fundraisingInfo = formData?.fundraisingInfo || {};
    const phases = fundraisingInfo.phases || [];

    return phases.length > 0 &&
      phases.every(phase =>
        phase &&
        phase.fundingGoal &&
        phase.startDate &&
        phase.duration
      );
  };

  const isRewardInfoComplete = () => {
    // Check if rewards exist and are properly structured
    const rewards = formData?.rewardInfo || [];
    const fundraisingInfo = formData?.fundraisingInfo || {};
    const phases = fundraisingInfo.phases || [];

    if (!rewards.length || !phases.length) return false;

    // Check if each phase has at least one reward
    const phaseIds = phases
      .filter(phase => phase && phase.id)
      .map(phase => phase.id);

    // Check if each phase has at least one reward with proper item structure
    if (phaseIds.length === 0) return false;

    const phasesCovered = phaseIds.every(phaseId =>
      rewards.some(reward => reward && reward.phaseId === phaseId)
    );

    // Check if rewards have properly structured items
    const rewardsWithProperItems = rewards.every(reward => {
      if (!reward) return false;

      // Basic required fields
      const hasBasicFields = reward.title && reward.description && reward.amount &&
        reward.estimatedDelivery && reward.phaseId;

      // If no items, that's okay (not required)
      if (!Array.isArray(reward.items) || reward.items.length === 0) {
        return hasBasicFields;
      }

      // If items exist, each must have a name
      const itemsHaveNames = reward.items.every(item => item && item.name);

      return hasBasicFields && itemsHaveNames;
    });

    return phasesCovered && rewardsWithProperItems;
  };

  const isProjectStoryComplete = () => {
    // Enhanced validation for rich project story
    const story = formData?.projectStory || '';

    // Basic check for content length
    if (typeof story !== 'string' || story.trim().length < 200) {
      return false;
    }

    // Check for character limit
    if (typeof window !== 'undefined') {
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = story;
        const plainText = tempDiv.textContent || '';

        // Story is not valid if it exceeds character limit
        if (plainText.length > MAX_STORY_CHARS) {
          return false;
        }

        // Check for minimum content elements
        const hasHeadings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
        const hasParagraphs = tempDiv.querySelectorAll('p').length > 1; // At least 2 paragraphs
        const hasMedia = tempDiv.querySelectorAll('img, iframe').length > 0;

        // Story should have at least headings and paragraphs
        return hasParagraphs && (hasHeadings || hasMedia);
      } catch (error) {
        console.error('Error analyzing story completion:', error);
        // Fallback to basic length check if DOM parsing fails
        return story.length > 500 && story.length <= MAX_STORY_CHARS;
      }
    }

    // For server-side rendering, just check length
    return story.length > 500 && story.length <= MAX_STORY_CHARS;
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
      .map(phase => `Phase ${phase.id}`);
  };
  // Check for rewards with missing item images
  const getRewardsWithMissingImages = () => {
    const rewards = formData?.rewardInfo || [];
    if (!rewards.length) return [];

    return rewards
      .filter(reward => {
        // Only include rewards that have items but missing images
        if (!Array.isArray(reward?.items) || reward.items.length === 0) {
          return false;
        }
        // Check if any items are missing images
        return reward.items.some(item => item && item.name && !item.image);
      })
      .map(reward => reward.title || `Reward #${reward.id}`);
  };

  // Check for missing content blocks in project story
  const getMissingStoryElements = () => {
    if (typeof window === 'undefined' || !formData?.projectStory) {
      return [];
    }

    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formData.projectStory;

      // Check if the story exceeds character limit
      const plainText = tempDiv.textContent || '';
      if (plainText.length > MAX_STORY_CHARS) {
        return ['character limit compliance'];
      }

      const missingElements = [];

      if (tempDiv.querySelectorAll('h1, h2, h3').length === 0) {
        missingElements.push('headings');
      }

      if (tempDiv.querySelectorAll('img').length === 0) {
        missingElements.push('images');
      }

      if (tempDiv.querySelectorAll('ul, ol').length === 0) {
        missingElements.push('lists');
      }

      return missingElements;
    } catch (error) {
      console.error('Error checking story elements:', error);
      return [];
    }
  };

  const phasesMissingRewards = getPhasesMissingRewards();
  const rewardsWithMissingImages = getRewardsWithMissingImages();
  const missingStoryElements = getMissingStoryElements();

  // Check if story exceeds character limit
  const isStoryOverCharLimit = () => {
    if (typeof window === 'undefined' || !formData?.projectStory) {
      return false;
    }

    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formData.projectStory;
      const plainText = tempDiv.textContent || '';
      return plainText.length > MAX_STORY_CHARS;
    } catch (error) {
      console.error('Error checking story character limit:', error);
      return false;
    }
  };

  const storyOverCharLimit = isStoryOverCharLimit();

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
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
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
                  className={`${item.completion === 100 ? 'text-green-500' : 'text-blue-500'} transition-all duration-300 ease-in-out`}
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
              <span className="absolute top-0 left-0 -mt-8 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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

              {/* Extra information for rewards section */}
              {item.id === 'rewards' && item.completion > 0 && item.completion < 100 && (
                <ul className="mt-1 pl-3 text-xs text-blue-600 list-disc">
                  {phasesMissingRewards.length > 0 && (
                    <li>Add rewards for: {phasesMissingRewards.join(', ')}</li>
                  )}
                  {rewardsWithMissingImages.length > 0 && (
                    <li>Add images to items in: {rewardsWithMissingImages.join(', ')}</li>
                  )}
                </ul>
              )}

              {/* Extra information for story section */}
              {item.id === 'story' && (
                <ul className="mt-1 pl-3 text-xs list-disc">
                  {storyOverCharLimit && (
                    <li className="text-red-600 font-medium">
                      Your story exceeds the {MAX_STORY_CHARS.toLocaleString()} character limit. Please reduce the content.
                    </li>
                  )}
                  {item.completion > 0 && item.completion < 100 && missingStoryElements.length > 0 && !storyOverCharLimit && (
                    <li className="text-blue-600">
                      Add {missingStoryElements.join(', ')} to make your story more engaging
                    </li>
                  )}
                </ul>
              )}
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

      {storyOverCharLimit && (
        <div className="mt-4 bg-red-50 border border-red-100 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Character Limit Exceeded</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Your project story exceeds the {MAX_STORY_CHARS.toLocaleString()} character limit. Please edit your content to be more concise.
                  Consider using more images and formatted lists to convey information efficiently.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {rewardsWithMissingImages.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Recommendation</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Adding images to reward items increases backer trust and conversion rates.
                  Consider adding images to items in: {rewardsWithMissingImages.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {missingStoryElements.length > 0 && formData?.projectStory && !storyOverCharLimit && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Enhance Your Story</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Projects with diverse content elements have a higher success rate. Add {missingStoryElements.join(', ')} to make your story more compelling while staying within the {MAX_STORY_CHARS.toLocaleString()} character limit.
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
          <li>Each reward should include descriptive items with images</li>
          <li>Project story must include multiple content blocks and be under {MAX_STORY_CHARS.toLocaleString()} characters</li>
          <li>All mandatory documents must be uploaded</li>
          <li>Payment information must be accurate and verified</li>
        </ul>
      </div>
    </div>
  );
}

// Add prop type validation
ProjectCreationChecklist.propTypes = {
  formData: PropTypes.object,
  sections: PropTypes.array
};

// Default props
ProjectCreationChecklist.defaultProps = {
  formData: {},
  sections: []
};