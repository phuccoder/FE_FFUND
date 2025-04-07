import React, { useEffect, useState } from 'react';
import RulesTerms from '../components/CreateProject/RulesTerms';
import BasicInformation from '../components/CreateProject/BasicInformation';
import FundraisingInformation from '../components/CreateProject/FundraisingInformation';
import RewardInformation from '../components/CreateProject/RewardInformation';
import ProjectStory from '../components/CreateProject/ProjectStory';
import FounderProfile from '../components/CreateProject/FounderProfile';
import RequiredDocuments from '../components/CreateProject/RequiredDocuments';
import PaymentInformation from '../components/CreateProject/PaymentInformation';
import ProjectCreationNavigation from '../components/CreateProject/ProjectCreationNavigation';
import ProjectCreationChecklist from '../components/CreateProject/ProjectCreationChecklist';
import PageTitle from '@/components/Reuseable/PageTitle';
import Layout from '@/components/Layout/Layout';
import projectService from 'src/services/projectService';
import { tokenManager } from '@/utils/tokenManager';
import ProjectStoryHandler from '@/components/CreateProject/ProjectStoryHandler';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from '@/components/Reuseable/Link';

function CreateProject() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    termsAgreed: false,
    basicInfo: {
      title: '',
      category: '',
      shortDescription: '',
      location: '',
      projectUrl: '',
      mainSocialMediaUrl: '',
      projectVideoDemo: '',
      isClassPotential: false,
    },
    fundraisingInfo: {
      startDate: '',
      phases: []  // Add phases array to store multiple funding phases
    },
    rewardInfo: [],  // This will now contain phase-specific rewards
    projectStory: {
      story: '',
      risks: ''
    },
    founderProfile: {
      bio: '',
      experience: '',
      socialLinks: {
        website: '',
        linkedin: '',
        twitter: '',
      },
      team: [],
    },
    requiredDocuments: {
      mandatory: {
        swotAnalysis: null,
        businessModelCanvas: null,
        businessPlan: null,
        marketResearch: null,
        financialInformation: null,
        projectMedia: [],
      },
      optional: {
        customerAcquisitionPlan: null,
        revenueProof: null,
        visionStrategy: null,
      },
    },
    paymentInfo: {
      id: null,
      stripeAccountId: null,
      status: 'NOT_STARTED',
    },
  });
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    isLoading: true
  });
  const [isEditAllowed, setIsEditAllowed] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const savedAgreement = localStorage.getItem('agreedToTerms');
    setFormData((prevData) => ({
      ...prevData,
      termsAgreed: savedAgreement ? JSON.parse(savedAgreement) : false,
    }));
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await tokenManager.getValidToken();
        setAuthStatus({
          isAuthenticated: !!token,
          isLoading: false
        });
      } catch (error) {
        console.error("Error checking authentication:", error);
        setAuthStatus({
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    checkAuth();

    // Set up a listener for storage events to detect login/logout in other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'userId') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Define loadProjectData outside useEffect
  const loadProjectData = async () => {
    console.log("Loading project data...");
    setIsEditMode(false); // Reset edit mode

    try {
      // First try to get user's projects
      console.log("Fetching projects for current founder...");
      const response = await projectService.getProjectsByFounder();
      console.log("API response:", response);

      // Handle both array and single object responses
      let activeProject;

      if (Array.isArray(response) && response.length > 0) {
        // If response is an array, take first element
        activeProject = response[0];
        console.log("Found active project from array:", activeProject);
      } else if (response && (response.projectId || response.id)) {
        // If response is a single project object
        activeProject = response;
        console.log("Found active project (single object):", activeProject);
      } else if (response && response.data) {
        // If response has a data property (nested response)
        activeProject = response.data;
        console.log("Found active project in response.data:", activeProject);
      }

      if (activeProject && (activeProject.projectId || activeProject.id)) {
        // Get the project ID, accounting for different field names
        const projectId = activeProject.projectId || activeProject.id;
        const status = activeProject.status || 'DRAFT';

        // Check if editing is allowed based on status
        const isAllowedStatus = status === 'DRAFT';
        setIsEditAllowed(isAllowedStatus);

        // Store the projectId in localStorage for persistence
        localStorage.setItem('founderProjectId', projectId);

        // Update UI state
        setIsEditMode(true);

        console.log("Setting project data with ID:", projectId);
        console.log("Project status:", status, "Editing allowed:", isAllowedStatus);
        // Update form data with project details
        setFormData(prevData => ({
          ...prevData,
          projectId: projectId,
          basicInfo: {
            ...prevData.basicInfo,
            projectId: projectId,
            title: activeProject.title || activeProject.projectTitle || '',
            shortDescription: activeProject.description || activeProject.projectDescription || '',
            projectDescription: activeProject.description || activeProject.projectDescription || '',
            category: activeProject.category?.id || '',
            categoryId: activeProject.category?.id || '',
            subCategoryIds: activeProject.subCategories?.map(sub => sub.id) || [],
            location: activeProject.location || activeProject.projectLocation || '',
            projectLocation: activeProject.location || activeProject.projectLocation || '',
            projectUrl: activeProject.projectUrl || '',
            mainSocialMediaUrl: activeProject.mainSocialMediaUrl || '',
            projectVideoDemo: activeProject.projectVideoDemo || '',
            totalTargetAmount: activeProject.totalTargetAmount || 1000,
            isClassPotential: activeProject.isClassPotential !== undefined
              ? activeProject.isClassPotential
              : false,
            status: status
          },
          projectStory: {
            ...prevData.projectStory,
            story: activeProject.projectStory || '',
            risks: activeProject.risks || ''
          },
          paymentInfo: {
            id: activeProject.paymentId || activeProject.payment?.id,
            stripeAccountId: activeProject.stripeAccountId || activeProject.payment?.stripeAccountId,
            status: (activeProject.stripeAccountId || activeProject.payment?.stripeAccountId) ? 'LINKED' :
              (activeProject.paymentId || activeProject.payment?.id) ? 'PENDING' : 'NOT_STARTED'
          }
        }));
      } else {
        // User has no projects, clear any stored projectId
        localStorage.removeItem('founderProjectId');
        setIsEditAllowed(true);

        // Reset form to default state
        setFormData(prevData => ({
          ...prevData,
          projectId: null,
          basicInfo: {
            ...prevData.basicInfo,
            projectId: null,
            title: '',
            shortDescription: '',
            category: '',
            categoryId: '',
            subCategoryIds: [],
            location: '',
            projectLocation: '',
            projectUrl: '',
            mainSocialMediaUrl: '',
            projectVideoDemo: '',
            isClassPotential: false
          }
        }));
      }
    } catch (error) {
      console.error("Error loading project data:", error);
      // On error, clear stored project ID
      localStorage.removeItem('founderProjectId');
    }
  };

  // Update the useEffect to call this function

  useEffect(() => {
    if (!authStatus.isLoading) {
      loadProjectData();
    }
  }, [authStatus.isAuthenticated, authStatus.isLoading]);

  useEffect(() => {
    const teamRole = localStorage.getItem('teamRole');
    console.log("User teamRole:", teamRole);
    setUserRole(teamRole);

  }, [authStatus.isAuthenticated, authStatus.isLoading]);

  useEffect(() => {
    console.log("Terms complete:", Boolean(formData.termsAgreed));

    const basicInfo = formData.basicInfo || {};
    console.log("Basic info validation:", {
      title: !!basicInfo.title,
      category: !!(basicInfo.category || basicInfo.categoryId),
      subCategory: !!(basicInfo.subCategory || basicInfo.subCategoryIds),
      shortDescription: !!basicInfo.shortDescription,
      location: !!(basicInfo.location || basicInfo.locationId),
      projectUrl: !!basicInfo.projectUrl,
      mainSocialMediaUrl: !!basicInfo.mainSocialMediaUrl,
      projectVideoDemo: !!basicInfo.projectVideoDemo,
      isClassPotential: basicInfo.isClassPotential !== undefined
    });

    console.log("Can access later sections:", isInitialSectionsComplete());
  }, [formData]);

  // Update milestone data to match the expected rewardInfo format
  useEffect(() => {
    // Check if formData contains milestones but not rewardInfo items
    if (formData.milestones?.length > 0 && formData.rewardInfo?.length === 0) {
      console.log("Converting milestones to rewardInfo format");

      // Map milestones to the rewardInfo format expected by the checklist
      const rewardInfoFromMilestones = formData.milestones.map(milestone => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description || '',
        amount: milestone.price || '0',
        phaseId: milestone.phaseId,
        estimatedDelivery: milestone.estimatedDelivery || new Date().toISOString().split('T')[0],
        items: milestone.items || []
      }));

      // Update the formData with the rewardInfo
      setFormData(prevData => ({
        ...prevData,
        rewardInfo: rewardInfoFromMilestones
      }));
    }
  }, [formData.milestones]);


  // In create-project.js, check if projectId is populated after the API call
  useEffect(() => {
    console.log("Current form data:", formData);
    console.log("ProjectId available:", formData.projectId);
    console.log("ProjectId in basicInfo:", formData.basicInfo?.projectId);
  }, [formData]);

  const handleUpdateFormData = (section, data) => {
    console.log(`Updating form data for section ${section}:`, data);

    // Check if data contains a projectId
    const projectId = data.projectId || data.id;
    const projectImage = data.projectImage;

    // Log the projectImage if it exists
    if (projectImage) {
      console.log(`Section ${section} includes projectImage:`, projectImage);
    }

    // If a new projectId is received, store it in localStorage
    if (projectId && (!formData.projectId || formData.projectId !== projectId)) {
      console.log("Storing new project ID in localStorage:", projectId);
      localStorage.setItem('founderProjectId', projectId);
    }

    // Handle termsAgreed section
    if (section === 'termsAgreed') {
      localStorage.setItem('agreedToTerms', JSON.stringify(data)); // Save to localStorage
    }

    setFormData((prevData) => {
      // Special handling for basicInfo to ensure consistent field structure
      if (section === 'basicInfo') {
        const updatedBasicInfo = {
          ...data,
          projectId: projectId || data.projectId || prevData.projectId,
          category: data.category || data.categoryId,
          categoryId: data.categoryId || data.category,
          location: data.location || data.projectLocation,
          projectLocation: data.projectLocation || data.location,
          shortDescription: data.shortDescription || data.projectDescription,
          projectDescription: data.projectDescription || data.shortDescription,
          projectImage: data.projectImage || prevData.basicInfo?.projectImage,
        };

        console.log("Updated basicInfo with projectImage:", updatedBasicInfo.projectImage);

        return {
          ...prevData,
          projectId: projectId || prevData.projectId,
          [section]: updatedBasicInfo,
          projectImage: data.projectImage || prevData.projectImage,
        };
      }

      // For other sections, just update normally
      return {
        ...prevData,
        projectId: projectId || prevData.projectId,
        [section]: data,
      };
    });
  };

  // When loading initial project data after page load
  const loadInitialProjectData = async () => {
    try {
      const projectId = localStorage.getItem('founderProjectId');
      if (projectId) {
        const projectDetails = await projectService.getProjectById(projectId);
        const projectData = projectDetails.data || projectDetails;

        // Log the project image
        console.log('Loading project with image:', projectData.projectImage);

        setFormData(prev => ({
          ...prev,
          projectId: projectData.id,
          basicInfo: {
            projectId: projectData.id,
            title: projectData.title || '',
            shortDescription: projectData.description || '',
            projectDescription: projectData.description || '',
            location: projectData.location || '',
            projectLocation: projectData.location || '',
            projectUrl: projectData.projectUrl || '',
            mainSocialMediaUrl: projectData.mainSocialMediaUrl || '',
            projectVideoDemo: projectData.projectVideoDemo || '',
            categoryId: projectData.category?.id || '',
            subCategoryIds: projectData.subCategories?.map(sub => sub.id) || [],
            totalTargetAmount: projectData.totalTargetAmount || 1000,
            status: projectData.status || 'DRAFT',
            isClassPotential: projectData.isClassPotential || false,
            projectImage: projectData.projectImage || null
          },
          // Also store at top level
          projectImage: projectData.projectImage || null
        }));
      }
    } catch (error) {
      console.error('Error loading initial project data:', error);
    }
  };

  // Check if the first two sections are completed to enable navigation to later sections
  const isInitialSectionsComplete = () => {
    const isTermsComplete = Boolean(formData.termsAgreed);

    const basicInfo = formData.basicInfo || {};
    const categoryValue = basicInfo.category || basicInfo.categoryId;
    const locationValue = basicInfo.location || basicInfo.locationId;
    const subCategoryValue = basicInfo.subCategory || basicInfo.subCategoryIds;

    const isBasicInfoComplete = Boolean(
      basicInfo.title &&
      categoryValue &&
      subCategoryValue &&
      basicInfo.shortDescription &&
      locationValue &&
      basicInfo.projectUrl &&
      basicInfo.mainSocialMediaUrl &&
      basicInfo.projectVideoDemo &&
      basicInfo.projectImage
    );

    return isTermsComplete && isBasicInfoComplete;
  };

  const hasPhases = () => {
    return formData.fundraisingInfo.phases && formData.fundraisingInfo.phases.length > 0;
  };

  // Check if the project story is complete
  const isProjectStoryComplete = () => {
    const projectStory = formData.projectStory || {};

    // Get story and risks
    const story = projectStory.story || '';
    const risks = projectStory.risks || '';

    // Create temp divs to parse HTML and get text content
    if (typeof window !== 'undefined') {
      const storyDiv = document.createElement('div');
      storyDiv.innerHTML = story;
      const storyText = storyDiv.textContent || '';

      const risksDiv = document.createElement('div');
      risksDiv.innerHTML = risks;
      const risksText = risksDiv.textContent || '';

      // Check for minimum content
      return storyText.length >= 200 && risksText.length >= 100;
    }

    // Simple check for SSR
    return story.length > 0 && risks.length > 0;
  };

  const sections = [
    {
      id: 'terms',
      name: 'Rules & Terms',
      component: (
        <RulesTerms
          formData={formData.termsAgreed}
          updateFormData={(data) => handleUpdateFormData('termsAgreed', data)}
        />
      ),
    },
    {
      id: 'basic',
      name: 'Basic Information',
      component: <BasicInformation
        formData={{
          ...formData.basicInfo,
          projectId: formData.projectId || formData.basicInfo?.projectId,
        }}
        updateFormData={(data) => handleUpdateFormData('basicInfo', data)}
        editMode={isEditMode}
      />
    },
    { id: 'fundraising', name: 'Fundraising Information', component: <FundraisingInformation formData={formData.fundraisingInfo} updateFormData={(data) => handleUpdateFormData('fundraisingInfo', data)} projectId={formData.projectId || formData.basicInfo?.projectId} /> },
    { id: 'rewards', name: 'Reward Information', component: <RewardInformation formData={formData.rewardInfo} projectData={formData.fundraisingInfo} updateFormData={(data) => handleUpdateFormData('rewardInfo', data)} /> },
    // Update the ProjectStoryHandler section in the sections array
    {
      id: 'story',
      name: 'Project Story',
      component: <ProjectStoryHandler
        projectId={formData.projectId || formData.basicInfo?.projectId}
        initialStoryData={formData.projectStory}
        updateFormData={(data) => handleUpdateFormData('projectStory', data)}
      />
    },
    {
      id: 'founder',
      name: 'Founder Profile',
      component: <FounderProfile
        formData={formData.founderProfile}
        updateFormData={(data) => handleUpdateFormData('founderProfile', data)}
        projectId={formData.projectId || formData.basicInfo?.projectId}
      />
    },
    {
      id: 'documents',
      name: 'Required Documents',
      component: <RequiredDocuments
        formData={formData.requiredDocuments}
        updateFormData={(data) => handleUpdateFormData('requiredDocuments', data)}
        projectId={formData.projectId || formData.basicInfo?.projectId}
      />
    },
    // In the payment section component:

    {
      id: 'payment',
      name: 'Payment Information',
      component: <PaymentInformation
        projectData={{
          id: formData.projectId || formData.basicInfo?.projectId,
          title: formData.basicInfo?.title
        }}
        updateFormData={(data) => {
          console.log("PaymentInfo update received:", JSON.stringify(data, null, 4));

          // Only update if we received valid data
          if (data && (data.id || data.stripeAccountId || data.paymentInfo)) {
            // Handle data coming in different formats
            const paymentData = data.paymentInfo || data;

            setFormData(prevData => ({
              ...prevData,
              paymentInfo: {
                ...prevData.paymentInfo,
                ...paymentData,
                // Ensure critical fields are preserved
                id: paymentData.id || prevData.paymentInfo?.id,
                stripeAccountId: paymentData.stripeAccountId || prevData.paymentInfo?.stripeAccountId,
                // Set status based on available data
                status: paymentData.stripeAccountId ? 'LINKED' :
                  paymentData.id ? 'PENDING' : 'NOT_STARTED'
              }
            }));
          }
        }}
        readOnly={!formData.projectId && !formData.basicInfo?.projectId}
        // Pass current payment info to component for reference
        paymentInfo={formData.paymentInfo}
      />
    }
  ];

  const goToNextSection = () => {
    if (currentSection < sections.length - 1) {
      // If going from first section to second without completing it, show warning
      if (currentSection === 0) {
        const termsAgreed = formData.termsAgreed || JSON.parse(localStorage.getItem('agreedToTerms'));
        if (!termsAgreed) {
          alert("Please agree to the rules and terms before proceeding.");
          return;
        }
      }

      // If going from second section without completing it, show warning
      if (currentSection === 1) {
        const basicInfo = formData.basicInfo;
        const categoryValue = basicInfo.category || basicInfo.categoryId;
        const locationValue = basicInfo.location || basicInfo.locationId;
        const subCategoryValue = basicInfo.subCategory || basicInfo.subCategoryIds;

        if (
          !basicInfo.title ||
          !categoryValue ||
          !subCategoryValue ||
          !basicInfo.shortDescription ||
          !locationValue ||
          !basicInfo.projectUrl ||
          !basicInfo.mainSocialMediaUrl ||
          !basicInfo.projectVideoDemo ||
          basicInfo.isClassPotential === undefined
        ) {
          alert("Please complete all required fields in the Basic Information section.");
          return;
        }
      }

      // If going from fundraising to rewards section, check if phases exist
      if (currentSection === 2) {
        if (!hasPhases()) {
          alert("Please add at least one funding phase before proceeding to rewards.");
          return;
        }
      }

      // If going from project story to founder profile section, check if project story is complete
      if (currentSection === 4) {
        if (!isProjectStoryComplete()) {
          alert("Please complete the Project Story, or click 'Save button' section before proceeding to the Founder Profile section.");
          return;
        }
      }

      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToSection = (index) => {
    // Block navigation to sections beyond the first two if they're not complete
    if (index > 1 && !isInitialSectionsComplete()) {
      alert("Please complete the Rules & Terms and Basic Information sections first.");
      return;
    }

    // If trying to jump to rewards section, check if phases exist
    if (index === 3 && currentSection < 3) { // Index of rewards section
      if (!hasPhases()) {
        alert("Please add at least one funding phase before proceeding to rewards.");
        return;
      }
    }

    setCurrentSection(index);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    // Check user role first
    if (userRole !== 'LEADER') {
      alert("Only users with the Leader role can submit projects.");
      return;
    }

    // Validate that all required sections are complete
    if (!validateForm()) {
      alert("Please complete all required sections before submitting.");
      return;
    }

    // Get the project ID
    const projectId = formData.projectId || formData.basicInfo?.projectId;

    if (!projectId) {
      alert("No project ID found. Please save your project before submitting.");
      return;
    }

    try {
      // Show confirmation dialog
      const confirmSubmit = confirm(
        "Once submitted, your project will be reviewed by our team. " +
        "You won't be able to make changes during the review process. " +
        "Are you sure you want to submit your project now?"
      );

      if (!confirmSubmit) return;

      // Show loading state
      setIsSubmitting(true);

      // Call the API to submit the project
      const result = await projectService.submitProject(projectId);
      console.log("Project submission result:", result);

      // Show success message
      alert('Your project has been successfully submitted for review! You will be notified when the review is complete.');

      // Reload the project data to get the updated status
      await loadProjectData();
      window.location.href = '/';

    } catch (error) {
      console.error('Error submitting project:', error);
      alert(`Failed to submit project: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.termsAgreed) return false;
    if (!formData.basicInfo.title || !formData.basicInfo.category) return false;
    if (!hasPhases()) return false;
    if (formData.rewardInfo.length === 0) return false;
    if (!isProjectStoryComplete()) return false;

    // Check if each phase has at least one reward
    const phaseIds = formData.fundraisingInfo.phases.map(phase => phase.id);
    const rewardPhaseIds = formData.rewardInfo.map(reward => reward.phaseId);

    // Payment info check - we don't block submission on this but show a warning
    if (!formData.paymentInfo || !formData.paymentInfo.status || formData.paymentInfo.status !== 'LINKED') {
      const proceedWithoutPayment = confirm('Your payment information is not set up or not linked yet. You can still submit your project, but you will not be able to receive payments until you connect your Stripe account. Do you want to proceed?');
      if (!proceedWithoutPayment) return false;
    }

    // Make sure each phase has at least one reward
    return phaseIds.every(phaseId => rewardPhaseIds.includes(phaseId));
  };

  return (
    <>
      <Layout>
        {authStatus.isLoading && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-lg shadow-lg flex items-center space-x-4">
              <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg font-medium">Loading your project...</span>
            </div>
          </div>
        )}
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Your Project</h1>
            {!isEditAllowed && isEditMode ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Access Restricted</h3>
                    <p className="text-sm text-red-700 mt-1">
                      This project cannot be edited because it is currently in {formData.basicInfo?.status} status.
                      Only allow projects with DRAFT status.
                    </p>

                    <div className="mt-4 flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                      <Link href="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        <span>Return Home</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </Link>
                      <Link href="/edit-project" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <span>Edit Project</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <ProjectCreationNavigation
                    sections={sections}
                    currentSection={currentSection}
                    onSectionChange={goToSection}
                    formData={formData}
                  />
                </div>

                <div className="bg-white shadow rounded-lg p-6 mb-8">
                  <h2 className="text-2xl font-semibold mb-4">{sections[currentSection].name}</h2>
                  {sections[currentSection].component}

                  {/* Show guidance message when on the first two sections */}
                  {currentSection <= 1 && !isInitialSectionsComplete() && (
                    <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            Complete this section and the {currentSection === 0 ? 'Basic Information' : 'Rules & Terms'} section to unlock the rest of the form.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  {currentSection > 0 && (
                    <button
                      onClick={goToPrevSection}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                    >
                      Back
                    </button>
                  )}
                  {currentSection < sections.length - 1 ? (
                    <button
                      onClick={goToNextSection}
                      className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || userRole !== 'LEADER'}
                      className={`ml-auto ${isSubmitting || userRole !== 'LEADER'
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                        } text-white font-semibold py-2 px-4 rounded-lg flex items-center relative`}
                      title={userRole !== 'LEADER' ? "Only team leaders can submit projects" : ""}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        "Submit Project"
                      )}
                      {userRole !== 'LEADER' && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                          Only team leaders can submit
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-10">
                  <ProjectCreationChecklist formData={formData} sections={sections} />
                </div>
              </>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}

export default function CreateProjectPage() {
  return (
    <>
      <ProtectedRoute requiredRoles={['FOUNDER']}>
        <CreateProject />
      </ProtectedRoute>
    </>
  );
}