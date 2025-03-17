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

export default function CreateProject() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
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
    projectStory: '',
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
      accountName: '',
      accountNumber: '',
      bankName: '',
      swiftCode: '',
      country: '',
    },
  });
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    isLoading: true
  });

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
    } else if (response && response.projectId) {
      // If response is a single project object
      activeProject = response;
      console.log("Found active project (single object):", activeProject);
    }

    if (activeProject && activeProject.projectId) {
      // Store the projectId in localStorage for persistence
      localStorage.setItem('founderProjectId', activeProject.projectId);

      // Update UI state
      setIsEditMode(true);

      console.log("Setting project data with ID:", activeProject.projectId);
      
      // Update form data with project details
      setFormData(prevData => ({
        ...prevData,
        projectId: activeProject.projectId,
        basicInfo: {
          ...prevData.basicInfo,
          projectId: activeProject.projectId,
          title: activeProject.projectTitle || '',
          shortDescription: activeProject.projectDescription || '',
          category: activeProject.category?.id || '',
          categoryId: activeProject.category?.id || '',
          subCategoryIds: activeProject.subCategories?.map(sub => sub.id) || [],
          location: activeProject.projectLocation || '',
          projectLocation: activeProject.projectLocation || '',
          projectUrl: activeProject.projectUrl || '',
          mainSocialMediaUrl: activeProject.mainSocialMediaUrl || '',
          projectVideoDemo: activeProject.projectVideoDemo || '',
          isClassPotential: activeProject.isClassPotential !== undefined
            ? activeProject.isClassPotential
            : false
        }
      }));
    } else {
      // User has no projects, clear any stored projectId
      localStorage.removeItem('founderProjectId');

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


  // In create-project.js, check if projectId is populated after the API call
  useEffect(() => {
    console.log("Current form data:", formData);
    console.log("ProjectId available:", formData.projectId);
    console.log("ProjectId in basicInfo:", formData.basicInfo?.projectId);
  }, [formData]);

  const handleUpdateFormData = (section, data) => {
    // Check if data contains a projectId
    const projectId = data.projectId;

    // If a new projectId is received, store it in localStorage
    if (projectId && (!formData.projectId || formData.projectId !== projectId)) {
      console.log("Storing new project ID in localStorage:", projectId);
      localStorage.setItem('founderProjectId', projectId);
    }

    setFormData(prevData => {

      if (projectId && prevData.projectId !== projectId) {
        console.log("New project created with ID:", projectId);
        return {
          ...prevData,
          projectId,
          [section]: data
        };
      }

      // Otherwise just update the specific section
      return {
        ...prevData,
        [section]: data
      };
    });
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
      basicInfo.isClassPotential !== undefined
    );

    return isTermsComplete && isBasicInfoComplete;
  };

  const hasPhases = () => {
    return formData.fundraisingInfo.phases && formData.fundraisingInfo.phases.length > 0;
  };

  const sections = [
    { id: 'terms', name: 'Rules & Terms', component: <RulesTerms formData={formData.termsAgreed} updateFormData={(data) => handleUpdateFormData('termsAgreed', data)} /> },
    { id: 'basic', name: 'Basic Information', component: <BasicInformation formData={formData.basicInfo} updateFormData={(data) => handleUpdateFormData('basicInfo', data)} editMode={isEditMode} /> },
    { id: 'fundraising', name: 'Fundraising Information', component: <FundraisingInformation formData={formData.fundraisingInfo} updateFormData={(data) => handleUpdateFormData('fundraisingInfo', data)} projectId={formData.projectId || formData.basicInfo?.projectId} /> },
    { id: 'rewards', name: 'Reward Information', component: <RewardInformation formData={formData.rewardInfo} projectData={formData.fundraisingInfo} updateFormData={(data) => handleUpdateFormData('rewardInfo', data)} /> },
    { id: 'story', name: 'Project Story', component: <ProjectStory formData={formData.projectStory} updateFormData={(data) => handleUpdateFormData('projectStory', data)} /> },
    { id: 'founder', name: 'Founder Profile', component: <FounderProfile formData={formData.founderProfile} updateFormData={(data) => handleUpdateFormData('founderProfile', data)} projectId={formData.projectId || formData.basicInfo?.projectId} /> },
    { id: 'documents', name: 'Required Documents', component: <RequiredDocuments formData={formData.requiredDocuments} updateFormData={(data) => handleUpdateFormData('requiredDocuments', data)} /> },
    { id: 'payment', name: 'Payment Information', component: <PaymentInformation formData={formData.paymentInfo} updateFormData={(data) => handleUpdateFormData('paymentInfo', data)} /> },
  ];

  const goToNextSection = () => {
    if (currentSection < sections.length - 1) {
      // If going from first section to second without completing it, show warning
      if (currentSection === 0 && !formData.termsAgreed) {
        alert("Please agree to the rules and terms before proceeding.");
        return;
      }

      // If going from second section without completing it, show warning
      // If going from second section without completing it, show warning
      if (currentSection === 1) {
        const basicInfo = formData.basicInfo;
        const categoryValue = basicInfo.category || basicInfo.categoryId;
        const locationValue = basicInfo.location || basicInfo.locationId;
        const subCategoryValue = basicInfo.subCategory || basicInfo.subCategoryIds;

        if (!basicInfo.title ||
          !categoryValue ||
          !subCategoryValue ||
          !basicInfo.shortDescription ||
          !locationValue ||
          !basicInfo.projectUrl ||
          !basicInfo.mainSocialMediaUrl ||
          !basicInfo.projectVideoDemo ||
          basicInfo.isClassPotential === undefined) {
          alert("Please complete all required fields in the Basic Information section.");
          return;
        }
      }

      // If going from fundraising to rewards section, check if phases exist
      if (currentSection === 2) { // Index of fundraising section
        if (!hasPhases()) {
          alert("Please add at least one funding phase before proceeding to rewards.");
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
    // Validate that all required sections are complete
    if (!validateForm()) {
      alert("Please complete all required sections before submitting.");
      return;
    }

    try {
      // API call would go here
      console.log("Form data to submit:", formData);
      alert('Project submitted for review!');
    } catch (error) {
      console.error('Error submitting project:', error);
    }
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.termsAgreed) return false;
    if (!formData.basicInfo.title || !formData.basicInfo.category) return false;
    if (!hasPhases()) return false;
    if (formData.rewardInfo.length === 0) return false;

    // Check if each phase has at least one reward
    const phaseIds = formData.fundraisingInfo.phases.map(phase => phase.id);
    const rewardPhaseIds = formData.rewardInfo.map(reward => reward.phaseId);

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

            <div className="mb-8">
              <ProjectCreationNavigation
                sections={sections}
                currentSection={currentSection}
                onSectionChange={goToSection}
                formData={formData}  // Pass formData to check completion status
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
                  className="ml-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Submit Project
                </button>
              )}
            </div>

            <div className="mt-10">
              <ProjectCreationChecklist formData={formData} sections={sections} />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}