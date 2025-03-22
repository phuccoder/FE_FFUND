import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const MAX_STORY_CHARS = 5000;
const MAX_RISKS_CHARS = 5000;

export default function ProjectCreationChecklist({ formData = {}, sections }) {
  useEffect(() => {
    // Add extra debugging for payment info
    if (formData?.paymentInfo) {
      console.log("Payment Info in checklist component:", {
        id: formData.paymentInfo.id,
        stripeAccountId: formData.paymentInfo.stripeAccountId,
        status: formData.paymentInfo.status
      });
    }
  }, [formData.paymentInfo]);
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

        // Get unique phase IDs
        const phaseIds = phases
          .filter(phase => phase && phase.id)
          .map(phase => phase.id);

        if (phaseIds.length === 0) return 0;

        // Get unique phases that have rewards
        const phasesWithRewards = new Set(
          rewards
            .filter(reward => reward && reward.phaseId)
            .map(reward => reward.phaseId)
        );

        // Calculate phase coverage (what percentage of phases have at least one reward)
        const phaseCoverage = phaseIds.filter(id => phasesWithRewards.has(id)).length / phaseIds.length;

        // Check for complete reward fields
        let completedRewardFields = 0;
        let totalRewardFields = 0;

        // Count valid rewards
        let validRewardsCount = 0;

        // Process each reward
        rewards.forEach(reward => {
          if (!reward) return;

          // Track if this is a valid reward with all required fields
          let isValidReward = true;

          // Required fields validation
          const requiredFields = ['title', 'description', 'amount', 'estimatedDelivery', 'phaseId'];
          requiredFields.forEach(field => {
            totalRewardFields++;
            if (reward[field]) {
              completedRewardFields++;
            } else {
              isValidReward = false;
            }
          });

          // Check for items with names and images
          if (Array.isArray(reward.items)) {
            // Empty items array is valid (not all rewards need items)
            if (reward.items.length > 0) {
              reward.items.forEach(item => {
                // Item name is required if items exist
                totalRewardFields++;
                if (item && item.name) {
                  completedRewardFields++;
                } else {
                  isValidReward = false;
                }

                // Image is not required but gives bonus points
                if (item && item.image) {
                  completedRewardFields++;
                  totalRewardFields++;
                }
              });
            }
          }

          // Count this as a valid reward if all required fields are present
          if (isValidReward) {
            validRewardsCount++;
          }
        });

        // Calculate field completion percentage
        const fieldCompletionPercentage = totalRewardFields > 0
          ? (completedRewardFields / totalRewardFields) * 100
          : 0;

        // Calculate reward completeness based on both phase coverage and field completion
        // Give more weight to having rewards for all phases (70%) and less to field completion (30%)
        const rewardPercentage = Math.round((phaseCoverage * 70) + (fieldCompletionPercentage * 0.3));

        // If at least one valid reward exists and all phases have rewards, ensure minimum 50% completion
        if (validRewardsCount > 0 && phaseCoverage === 1) {
          return Math.max(rewardPercentage, 50);
        }

        return rewardPercentage;
      }

      case 'story': {
        // Enhanced project story evaluation with content blocks analysis
        const projectStory = data.projectStory || {};

        // Check if projectStory is a string or an object with story/risks properties
        let story = '';
        let risks = '';

        if (typeof projectStory === 'string') {
          story = projectStory;
        } else if (typeof projectStory === 'object') {
          story = projectStory.story || '';
          risks = projectStory.risks || '';
        }

        // Debug what we're analyzing
        console.log('ProjectCreationChecklist: analyzing story data', {
          hasProjectStory: !!projectStory,
          storyLength: story?.length || 0,
          risksLength: risks?.length || 0,
          storyType: typeof story,
          risksType: typeof risks
        });

        // If no story content, return 0
        if ((!story || typeof story !== 'string' || story.trim().length === 0) &&
          (!risks || typeof risks !== 'string' || risks.trim().length === 0)) {
          console.log('ProjectCreationChecklist: no story content found');
          return 0;
        }

        // Parse the HTML content to analyze structure and elements
        const parseAndAnalyzeStory = () => {
          try {
            if (typeof window === 'undefined') {
              // Server-side rendering fallback
              const storyLength = (story || '').length + (risks || '').length;
              // Basic length check - adjusted for 5000 character limit
              if (storyLength > 3000) return 80;
              if (storyLength > 1500) return 50;
              if (storyLength > 500) return 30;
              return 10;
            }

            // Client-side rich analysis
            // Create temp divs for both story and risks
            const storyDiv = document.createElement('div');
            storyDiv.innerHTML = story || '';
            const risksDiv = document.createElement('div');
            risksDiv.innerHTML = risks || '';

            // Extract plain text from both sections
            const storyText = storyDiv.textContent || '';
            const risksText = risksDiv.textContent || '';

            const storyCharCount = storyText.length;
            const risksCharCount = risksText.length;

            console.log('Story analysis - story chars:', storyCharCount, 'risks chars:', risksCharCount);

            // Check if main story is missing
            if (storyCharCount < 200) {
              return Math.min(30, Math.round(storyCharCount / 50));
            }

            // Check if risks section is missing
            if (risksCharCount < 100) {
              // Penalize missing risks section - cap at 60%
              return Math.min(60, Math.round((storyCharCount / MAX_STORY_CHARS) * 80));
            }

            // Count different elements in story
            const images = storyDiv.querySelectorAll('img').length;
            const headings = storyDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
            const paragraphs = storyDiv.querySelectorAll('p').length;
            const lists = storyDiv.querySelectorAll('ul, ol').length;
            const videos = storyDiv.querySelectorAll('.ProseMirror-youtube-iframe, iframe, [data-youtube-video], [data-type="VIDEO"]').length;

            console.log('Story elements - images:', images, 'headings:', headings,
              'paragraphs:', paragraphs, 'lists:', lists, 'videos:', videos);

            // Calculate base score from content length and completeness
            let score = 0;

            // Story content scoring (max: 70 points)
            if (storyCharCount > 3000) score += 35;
            else if (storyCharCount > 1500) score += 25;
            else if (storyCharCount > 800) score += 15;
            else if (storyCharCount > 300) score += 8;
            else score += 4;

            // Risks section scoring (max: 30 points)
            if (risksCharCount > 1000) score += 30;
            else if (risksCharCount > 500) score += 25;
            else if (risksCharCount > 200) score += 15;
            else if (risksCharCount > 100) score += 10;
            else score += 5;

            // Content variety scoring (bonus points up to 30)
            if (headings > 0) score += Math.min(headings * 3, 10); // Up to 10 points for headings
            if (images > 0) score += Math.min(images * 5, 20); // Up to 20 points for images
            if (paragraphs > 2) score += Math.min((paragraphs - 2) * 2, 10); // Up to 10 points for paragraphs
            if (lists > 0) score += Math.min(lists * 3, 9); // Up to 9 points for lists
            if (videos > 0) score += Math.min(videos * 4, 15); // Up to 15 points for videos

            console.log('Story final score:', score);

            return Math.min(score, 100);
          } catch (error) {
            console.error('Error analyzing story content:', error);
            // Fallback to basic length check
            const storyLength = (story || '').length + (risks || '').length;
            if (storyLength > 3000) return 70;
            if (storyLength > 1500) return 40;
            if (storyLength > 500) return 20;
            return 10;
          }
        };

        const score = parseAndAnalyzeStory();
        console.log('ProjectCreationChecklist: story final score', score);
        return score;
      }

      case 'founder': {
        // The data structure from FounderProfile is different than what this function expects
        // Handle all possible structures the data might come in
        const bio = formData.bio || (formData.founderProfile && formData.founderProfile.bio) || '';
        const fullName = formData.fullName || (formData.founderProfile && formData.founderProfile.fullName) || '';
        const email = formData.email || (formData.founderProfile && formData.founderProfile.email) || '';
        const team = formData.team || (formData.founderProfile && formData.founderProfile.team) || [];
        const studentInfo = formData.studentInfo || (formData.founderProfile && formData.founderProfile.studentInfo) || {};

        // Calculate completion score
        let completed = 0;
        const total = 5; // Required fields

        // Primary user info
        if (bio) completed++;
        if (fullName) completed++;
        if (email) completed++;

        // Student info is important
        if (studentInfo && Object.values(studentInfo).some(val => val)) {
          completed++;
        }

        // Team members
        if (team && Array.isArray(team) && team.length > 0) {
          completed++;
        }

        return Math.round((completed / total) * 100);
      }

      case 'documents': {
        const requiredDocs = data.requiredDocuments || {};
        const mandatory = requiredDocs.mandatory || {};
        const optional = requiredDocs.optional || {};

        let completed = 0;
        let total = 5; // 5 mandatory docs

        if (mandatory.swotAnalysis) completed++;
        if (mandatory.businessModelCanvas) completed++;
        if (mandatory.businessPlan) completed++;
        if (mandatory.marketResearch) completed++;
        if (mandatory.financialInformation) completed++;

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
        console.log("Payment info in completion calculation:", paymentInfo);

        // Return 0 if paymentInfo is empty or null
        if (!paymentInfo || typeof paymentInfo !== 'object' || Object.keys(paymentInfo).length === 0) {
          return 0;
        }

        // Direct check for status field
        if (paymentInfo.status === 'LINKED') {
          return 100;
        }

        // Stricter check for stripeAccountId - ensure it's a non-empty string
        if (paymentInfo.stripeAccountId && typeof paymentInfo.stripeAccountId === 'string'
          && paymentInfo.stripeAccountId.trim().length > 0) {
          return 100;
        }

        // Check for payment ID - ensure it's a non-empty string or number
        if ((paymentInfo.id && typeof paymentInfo.id === 'string' && paymentInfo.id.trim().length > 0) ||
          (paymentInfo.id && typeof paymentInfo.id === 'number' && paymentInfo.id > 0)) {
          return 40;
        }
        return 10;
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

  // Update isProjectStoryComplete function
  const isProjectStoryComplete = () => {
    // Enhanced validation for rich project story with risks
    const projectStory = formData?.projectStory || {};

    // Check if projectStory is a string or an object with story/risks properties
    let story = '';
    let risks = '';

    if (typeof projectStory === 'string') {
      story = projectStory;
    } else if (typeof projectStory === 'object') {
      story = projectStory.story || '';
      risks = projectStory.risks || '';
    }

    if (typeof window === 'undefined') {
      // Server-side simple check
      return typeof story === 'string' && story.length > 500 &&
        typeof risks === 'string' && risks.length > 100;
    }

    try {
      // Client-side thorough check
      // Check story section
      const storyDiv = document.createElement('div');
      storyDiv.innerHTML = story || '';
      const storyText = storyDiv.textContent || '';

      // Basic check for content length in story section
      if (storyText.length < 200) {
        return false;
      }

      // Check for risks section
      const risksDiv = document.createElement('div');
      risksDiv.innerHTML = risks || '';
      const risksText = risksDiv.textContent || '';

      // Basic check for content length in risks section
      if (risksText.length < 100) {
        return false;
      }

      // Check for character limit
      if (storyText.length > MAX_STORY_CHARS || risksText.length > MAX_RISKS_CHARS) {
        return false;
      }

      // Check for minimum content elements in story
      const hasHeadings = storyDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
      const hasParagraphs = storyDiv.querySelectorAll('p').length > 1; // At least 2 paragraphs
      const hasMedia = storyDiv.querySelectorAll('img, iframe, .ProseMirror-youtube-iframe, [data-youtube-video], [data-type="VIDEO"], [data-type="IMAGE"]').length > 0;

      // Check for minimum content in risks section
      const hasRisksParagraphs = risksDiv.querySelectorAll('p').length > 0;

      // Story should have at least headings and paragraphs, risks should have at least one paragraph
      return hasParagraphs && hasRisksParagraphs && (hasHeadings || hasMedia);
    } catch (error) {
      console.error('Error analyzing story completion:', error);
      // Fallback to basic length check if DOM parsing fails
      return typeof story === 'string' && story.length > 500 &&
        typeof risks === 'string' && risks.length > 100;
    }
  };

  const isFounderProfileComplete = () => {
    // Check for founder data in all possible locations
    const bio = formData.bio || (formData.founderProfile && formData.founderProfile.bio) || '';
    const fullName = formData.fullName || (formData.founderProfile && formData.founderProfile.fullName) || '';
    const email = formData.email || (formData.founderProfile && formData.founderProfile.email) || '';
    const studentInfo = formData.studentInfo || (formData.founderProfile && formData.founderProfile.studentInfo) || {};

    // Basic required fields
    const hasBasicInfo = Boolean(bio && fullName && email);

    // At least one student info field should be filled
    const hasStudentInfo = studentInfo &&
      Object.values(studentInfo).some(val => Boolean(val));

    return hasBasicInfo && hasStudentInfo;
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

    // Check for status directly
    if (paymentInfo.status === 'LINKED') {
      return true;
    }

    // Check for stripe account ID
    return paymentInfo &&
      paymentInfo.stripeAccountId &&
      typeof paymentInfo.stripeAccountId === 'string' &&
      paymentInfo.stripeAccountId.trim().length > 0;
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
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const projectStory = formData?.projectStory || {};

      // Handle different formats of story data
      let story = '';
      if (typeof projectStory === 'string') {
        story = projectStory;
      } else if (typeof projectStory === 'object') {
        story = projectStory.story || '';
      }

      if (!story) {
        return ['content'];
      }

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = story;

      // Check if the story exceeds character limit
      const plainText = tempDiv.textContent || '';
      if (plainText.length > MAX_STORY_CHARS) {
        return ['character limit compliance'];
      }

      const missingElements = [];

      // Check for key elements
      if (tempDiv.querySelectorAll('h1, h2, h3').length === 0) {
        missingElements.push('headings');
      }

      // Enhanced image detection to catch all possible image elements
      const hasImages = tempDiv.querySelectorAll('img, [data-type="IMAGE"], .image-container').length > 0;
      if (!hasImages) {
        missingElements.push('images');
      }

      // Enhanced video detection to catch all possible video elements
      const hasVideos = tempDiv.querySelectorAll('.ProseMirror-youtube-iframe, iframe[src*="youtube"], [data-youtube-video], [data-type="VIDEO"]').length > 0;
      if (!hasVideos) {
        // Only suggest videos if no images are present
        if (hasImages) {
          // Images exist, so videos are optional enhancement
          if (missingElements.length > 0 && !missingElements.includes('videos')) {
            missingElements.push('videos (optional)');
          }
        } else {
          missingElements.push('videos or images');
        }
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

  const isStoryOverCharLimit = () => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const projectStory = formData?.projectStory || {};

      // Handle different formats of story data
      let story = '';
      if (typeof projectStory === 'string') {
        story = projectStory;
      } else if (typeof projectStory === 'object') {
        story = projectStory.story || '';
      }

      if (!story) {
        return false;
      }

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = story;
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

      {/* Payment setup incomplete notification */}
      {formData?.paymentInfo?.id && !formData?.paymentInfo?.stripeAccountId && (
        <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Payment Setup Incomplete</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Your Stripe account connection is pending. Please complete the onboarding process in the Payment Information section to enable payments for your project.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No payment info notification */}
      {(!formData?.paymentInfo || Object.keys(formData?.paymentInfo || {}).length === 0) && (
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Connect With Stripe</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Connect your Stripe account in the Payment Information section to receive payments from project backers. This is required before submitting your project.
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
          <li>Stripe account must be connected and verified to receive payments</li>
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