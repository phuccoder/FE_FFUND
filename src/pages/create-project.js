import React,{ useState } from 'react';
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

export default function CreateProject() {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({
    termsAgreed: false,
    basicInfo: {
      title: '',
      category: '',
      tags: [],
      shortDescription: '',
      location: '',
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

  const handleUpdateFormData = (section, data) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: data
    }));
  };

  // Check if the first two sections are completed to enable navigation to later sections
  const isInitialSectionsComplete = () => {
    const isTermsComplete = Boolean(formData.termsAgreed);
    const basicInfo = formData.basicInfo || {};
    const { title, category, shortDescription } = basicInfo;
    const isBasicInfoComplete = Boolean(title && category && shortDescription);
    
    return isTermsComplete && isBasicInfoComplete;
  };

  // Function to validate if phases exist
  const hasPhases = () => {
    return formData.fundraisingInfo.phases && formData.fundraisingInfo.phases.length > 0;
  };

  const sections = [
    { id: 'terms', name: 'Rules & Terms', component: <RulesTerms formData={formData.termsAgreed} updateFormData={(data) => handleUpdateFormData('termsAgreed', data)} /> },
    { id: 'basic', name: 'Basic Information', component: <BasicInformation formData={formData.basicInfo} updateFormData={(data) => handleUpdateFormData('basicInfo', data)} /> },
    { id: 'fundraising', name: 'Fundraising Information', component: <FundraisingInformation formData={formData.fundraisingInfo} updateFormData={(data) => handleUpdateFormData('fundraisingInfo', data)} /> },
    { id: 'rewards', name: 'Reward Information', component: <RewardInformation formData={formData.rewardInfo} projectData={formData.fundraisingInfo} updateFormData={(data) => handleUpdateFormData('rewardInfo', data)} /> },
    { id: 'story', name: 'Project Story', component: <ProjectStory formData={formData.projectStory} updateFormData={(data) => handleUpdateFormData('projectStory', data)} /> },
    { id: 'founder', name: 'Founder Profile', component: <FounderProfile formData={formData.founderProfile} updateFormData={(data) => handleUpdateFormData('founderProfile', data)} /> },
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
      if (currentSection === 1) {
        const { title, category, shortDescription } = formData.basicInfo;
        if (!title || !category || !shortDescription) {
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
  );
}