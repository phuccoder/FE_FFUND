import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BasicInformation from '../components/CreateProject/BasicInformation';
import FundraisingInformation from '../components/CreateProject/FundraisingInformation';
import RewardInformation from '../components/CreateProject/RewardInformation';
import FounderProfile from '../components/CreateProject/FounderProfile';
import RequiredDocuments from '../components/CreateProject/RequiredDocuments';
import ProjectCreationNavigation from '../components/CreateProject/ProjectCreationNavigation';
import Layout from '@/components/Layout/Layout';
import projectService from 'src/services/projectService';
import { tokenManager } from '@/utils/tokenManager';
import ProjectStoryHandler from '@/components/CreateProject/ProjectStoryHandler';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import UpdateBlog from '@/components/UpdateBlog/UpdateBlog';

function EditProjectPage() {
  const router = useRouter();
  const { projectId } = router.query;
  
  const [currentSection, setCurrentSection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [updateNote, setUpdateNote] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [projectStatus, setProjectStatus] = useState('DRAFT');
  const [existingUpdates, setExistingUpdates] = useState([]);
  const [editRestrictions, setEditRestrictions] = useState({
    basicInfo: true,
    fundraisingInfo: true,
    rewardInfo: true,
    projectStory: true,
    founderProfile: true,
    requiredDocuments: true,
  });
  const [restrictedDocuments, setRestrictedDocuments] = useState([
    'swotAnalysis', 'businessModelCanvas', 'financialInformation'
  ]);
  const [formData, setFormData] = useState({
    // Add termsAgreed: true to unlock all sections in the navigation
    termsAgreed: true,
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
      phases: []
    },
    rewardInfo: [],
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
      status: 'NOT_STARTED'
    },
  });
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    isLoading: true
  });

  // Check authentication status
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
        
        // Redirect to login if not authenticated
        router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      }
    };

    checkAuth();
  }, [router]);

  // Load project data when projectId is available
  useEffect(() => {
    if (projectId && !authStatus.isLoading && authStatus.isAuthenticated) {
      loadProjectData(projectId);
      // Also load project updates
      loadProjectUpdates(projectId);
    }
  }, [projectId, authStatus.isLoading, authStatus.isAuthenticated]);

  // Load project updates
  const loadProjectUpdates = async (pid) => {
    try {
      const updates = await projectService.getProjectUpdates(pid);
      if (updates && Array.isArray(updates)) {
        setExistingUpdates(updates.map(update => ({
          title: update.title || '',
          content: update.content || '',
          date: update.createdAt || new Date().toISOString()
        })));
      }
    } catch (error) {
      console.error("Error loading project updates:", error);
    }
  };

  // Set edit restrictions based on project status
  useEffect(() => {
    if (projectStatus) {
      const restrictions = {
        basicInfo: true,
        fundraisingInfo: true,
        rewardInfo: true,
        projectStory: true,
        founderProfile: true,
        requiredDocuments: true,
      };

      // Apply restrictions based on project status
      if (projectStatus === 'FUNDRAISING') {
        // During fundraising, only allow editing of specific sections
        restrictions.fundraisingInfo = false;
        restrictions.rewardInfo = false;
      } else if (projectStatus === 'PENDING_APPROVAL' || projectStatus === 'REJECTED') {
        // While waiting for approval or after rejection, allow editing all sections
        // No restrictions needed
      } else if (projectStatus === 'APPROVED') {
        // When approved but not yet in fundraising, allow editing all sections
        // No restrictions needed
      } else if (projectStatus === 'FUNDRAISING_COMPLETED') {
        // After fundraising ends, allow editing all sections
        // No restrictions needed
      } else if (projectStatus === 'SUSPENDED' || projectStatus === 'CANCELLED') {
        // For suspended or cancelled projects, restrict all editing
        Object.keys(restrictions).forEach(key => {
          restrictions[key] = false;
        });
      }

      // Update restriction state
      setEditRestrictions(restrictions);
    }
  }, [projectStatus]);

  const loadProjectData = async (pid) => {
    console.log("Loading project data for ID:", pid);
    try {
      const response = await projectService.getProjectById(pid);
      console.log("Project data loaded:", response);

      if (response) {
        // Get project status
        const status = response.status || 'DRAFT';
        setProjectStatus(status);

        // Store original data for comparison
        setOriginalData(response);

        // Transform project data to match form structure
        setFormData(prevData => ({
          ...prevData,
          projectId: response.id,
          termsAgreed: true,
          basicInfo: {
            projectId: response.id,
            title: response.title || '',
            shortDescription: response.description || response.projectDescription || '',
            projectDescription: response.description || response.projectDescription || '',
            category: response.category?.id || '',
            categoryId: response.category?.id || '',
            subCategoryIds: response.subCategories?.map(sub => sub.id) || [],
            location: response.location || response.projectLocation || '',
            projectLocation: response.location || response.projectLocation || '',
            projectUrl: response.projectUrl || '',
            mainSocialMediaUrl: response.mainSocialMediaUrl || '',
            projectVideoDemo: response.projectVideoDemo || '',
            totalTargetAmount: response.totalTargetAmount || 1000,
            isClassPotential: response.isClassPotential !== undefined
              ? response.isClassPotential
              : false,
            status: response.status || 'DRAFT',
            // Add project image to the form data
            projectImage: response.projectImage || null
          },
          projectStory: {
            story: response.projectStory || response.story || '',
            risks: response.risks || ''
          },
          paymentInfo: {
            id: response.paymentId || response.payment?.id,
            stripeAccountId: response.stripeAccountId || response.payment?.stripeAccountId,
            status: (response.stripeAccountId || response.payment?.stripeAccountId) ? 'LINKED' :
              (response.paymentId || response.payment?.id) ? 'PENDING' : 'NOT_STARTED'
          }
        }));

        // Load fundraising info separately if available
        if (response.id) {
          try {
            console.log("Fetching fundraising info for project:", response.id);
            const fundraisingData = await projectService.getProjectFundraisingInfo(response.id);
            console.log("Fundraising data loaded:", fundraisingData);
            
            if (fundraisingData) {
              setFormData(prevData => ({
                ...prevData,
                fundraisingInfo: {
                  startDate: fundraisingData.startDate || '',
                  phases: fundraisingData.phases || []
                }
              }));
            }
          } catch (err) {
            console.error("Error loading fundraising info:", err);
          }

          // Load rewards data
          try {
            console.log("Fetching rewards for project:", response.id);
            const rewardsData = await projectService.getProjectRewards(response.id);
            console.log("Rewards data loaded:", rewardsData);
            
            if (rewardsData && Array.isArray(rewardsData)) {
              setFormData(prevData => ({
                ...prevData,
                rewardInfo: rewardsData
              }));
            }
          } catch (err) {
            console.error("Error loading rewards info:", err);
          }

          // Load founder profile data
          try {
            console.log("Fetching founder info for project:", response.id);
            const founderData = await projectService.getFounderInfo(response.id);
            console.log("Founder data loaded:", founderData);
            
            if (founderData) {
              setFormData(prevData => ({
                ...prevData,
                founderProfile: founderData
              }));
            }
          } catch (err) {
            console.error("Error loading founder info:", err);
          }

          // Load document data
          try {
            console.log("Fetching document info for project:", response.id);
            const documentsData = await projectService.getProjectDocuments(response.id);
            console.log("Documents data loaded:", documentsData);
            
            if (documentsData) {
              setFormData(prevData => ({
                ...prevData,
                requiredDocuments: documentsData
              }));
            }
          } catch (err) {
            console.error("Error loading document info:", err);
          }
        }
      }
    } catch (error) {
      console.error("Error loading project data:", error);
      alert("Failed to load project data. Please try again later.");
    }
  };

  const handleUpdateFormData = (section, data) => {
    console.log(`Updating ${section} data:`, data);
    
    // Check if we're in fundraising stage and detect changes
    if (projectStatus === 'FUNDRAISING') {
      // Check if section is allowed to be updated during fundraising
      if ((section === 'fundraisingInfo' || section === 'rewardInfo') ||
          (section === 'requiredDocuments' && hasRestrictedDocumentChanges(data))) {
        alert("You cannot update this information while the project is in the fundraising stage.");
        return;
      }
      
      // For allowed sections, flag that an update post will be required
      setUpdateRequired(true);
    }

    // Update form data
    setFormData(prevData => {
      return {
        ...prevData,
        [section]: data
      };
    });
  };

  // Check if restricted documents have been changed
  const hasRestrictedDocumentChanges = (newDocData) => {
    const currentDocs = formData.requiredDocuments;
    
    // Check for changes in restricted mandatory documents
    for (const docType of restrictedDocuments) {
      if (currentDocs?.mandatory?.[docType]?.id !== newDocData?.mandatory?.[docType]?.id) {
        return true;
      }
    }
    
    return false;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // If update is required but not posted, show the update modal
      if (updateRequired && projectStatus === 'FUNDRAISING') {
        setShowUpdateModal(true);
        setIsSaving(false);
        return;
      }

      // Prepare data for update
      const projectId = formData.projectId;
      console.log("Saving project with ID:", projectId);
      
      // Update basic info
      if (editRestrictions.basicInfo) {
        console.log("Updating basic info");
        await projectService.updateProjectInfo(projectId, formData.basicInfo);
      }
      
      // Update fundraising info
      if (editRestrictions.fundraisingInfo) {
        console.log("Updating fundraising info");
        await projectService.updateFundraisingInfo(projectId, formData.fundraisingInfo);
      }
      
      // Update rewards
      if (editRestrictions.rewardInfo) {
        console.log("Updating reward info");
        await projectService.updateProjectRewards(projectId, formData.rewardInfo);
      }
      
      // Update project story
      if (editRestrictions.projectStory) {
        console.log("Updating project story");
        await projectService.updateProjectStory(projectId, formData.projectStory);
      }
      
      // Update founder profile
      if (editRestrictions.founderProfile) {
        console.log("Updating founder profile");
        await projectService.updateFounderProfile(projectId, formData.founderProfile);
      }
      
      // Update documents with restrictions
      if (editRestrictions.requiredDocuments) {
        // If in fundraising stage, filter out restricted documents
        if (projectStatus === 'FUNDRAISING') {
          const safeDocuments = { ...formData.requiredDocuments };
          
          // Keep original values for restricted documents
          for (const docType of restrictedDocuments) {
            if (originalData?.requiredDocuments?.mandatory?.[docType]) {
              safeDocuments.mandatory[docType] = originalData.requiredDocuments.mandatory[docType];
            }
          }
          
          console.log("Updating documents with restrictions");
          await projectService.updateProjectDocuments(projectId, safeDocuments);
        } else {
          // If not in fundraising, update all documents
          console.log("Updating all documents");
          await projectService.updateProjectDocuments(projectId, formData.requiredDocuments);
        }
      }
      
      // If project is in REJECTED status and now editing, change to PENDING_APPROVAL
      if (projectStatus === 'REJECTED') {
        console.log("Resubmitting rejected project");
        await projectService.submitProject(projectId);
        setProjectStatus('PENDING_APPROVAL');
      }
      
      // Reset the update required flag
      setUpdateRequired(false);
      
      // Show success message
      alert("Project updated successfully!");
      
      // Reload project data
      await loadProjectData(projectId);
      
    } catch (error) {
      console.error("Error saving project:", error);
      alert(`Failed to save project: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!updateNote.trim()) {
      alert("Please provide details about the changes you made.");
      return;
    }

    try {
      setIsPosting(true);

      // Submit the update note
      console.log("Posting project update");
      await projectService.postProjectUpdate(formData.projectId, {
        content: updateNote,
        updateType: 'PROJECT_EDIT',
        isPublic: true
      });

      // After posting update, save changes
      setShowUpdateModal(false);
      await handleSave();
      setUpdateNote('');

    } catch (error) {
      console.error("Error posting update:", error);
      alert(`Failed to post update: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPosting(false);
    }
  };

  // Handle saving a new update from UpdateBlog component
  const handleSaveUpdate = async (update) => {
    try {
      await projectService.postProjectUpdate(formData.projectId, {
        title: update.title,
        content: update.content,
        updateType: 'GENERAL',
        isPublic: true
      });
      
      // Refresh the list of updates
      await loadProjectUpdates(formData.projectId);
      
      // Show success message
      alert("Update posted successfully!");
      
      // Go back to first section
      setCurrentSection(0);
      
      return true;
    } catch (error) {
      console.error("Error posting update:", error);
      alert(`Failed to post update: ${error.message || 'Unknown error'}`);
      return false;
    }
  };

  const goToPrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToSection = (index) => {
    setCurrentSection(index);
    window.scrollTo(0, 0);
  };

  // Define base sections without the update blog
  const baseSections = [
    {
      id: 'basic',
      name: 'Basic Information',
      component: <BasicInformation
        formData={{
          ...formData.basicInfo,
          projectId: formData.projectId,
        }}
        updateFormData={(data) => handleUpdateFormData('basicInfo', data)}
        editMode={true}
        readOnly={!editRestrictions.basicInfo}
      />
    },
    {
      id: 'fundraising',
      name: 'Fundraising Information',
      component: <FundraisingInformation
        formData={formData.fundraisingInfo}
        updateFormData={(data) => handleUpdateFormData('fundraisingInfo', data)}
        projectId={formData.projectId}
        readOnly={!editRestrictions.fundraisingInfo}
      />
    },
    {
      id: 'rewards',
      name: 'Reward Information',
      component: <RewardInformation
        formData={formData.rewardInfo}
        projectData={formData.fundraisingInfo}
        updateFormData={(data) => handleUpdateFormData('rewardInfo', data)}
        readOnly={!editRestrictions.rewardInfo}
      />
    },
    {
      id: 'story',
      name: 'Project Story',
      component: <ProjectStoryHandler
        projectId={formData.projectId}
        initialStoryData={formData.projectStory}
        updateFormData={(data) => handleUpdateFormData('projectStory', data)}
        readOnly={!editRestrictions.projectStory}
      />
    },
    {
      id: 'founder',
      name: 'Founder Profile',
      component: <FounderProfile
        formData={formData.founderProfile}
        updateFormData={(data) => handleUpdateFormData('founderProfile', data)}
        projectId={formData.projectId}
        readOnly={!editRestrictions.founderProfile}
      />
    },
    {
      id: 'documents',
      name: 'Required Documents',
      component: <RequiredDocuments
        formData={formData.requiredDocuments}
        updateFormData={(data) => handleUpdateFormData('requiredDocuments', data)}
        projectId={formData.projectId}
        readOnly={!editRestrictions.requiredDocuments}
        restrictedDocuments={projectStatus === 'FUNDRAISING' ? restrictedDocuments : []}
      />
    },
  ];

  // Add UpdateBlog section for edit mode
  const updateBlogSection = {
    id: 'update-blog',
    name: 'Post Updates',
    component: (
      <UpdateBlog 
        onSave={handleSaveUpdate}
        onCancel={() => setCurrentSection(0)}
        existingUpdates={existingUpdates}
      />
    )
  };

  // Create full sections array with update blog section
  const sections = [...baseSections, updateBlogSection];

  // Get status label and color
  const getStatusDisplay = (status) => {
    const statusMap = {
      'DRAFT': { label: 'Draft', color: 'bg-gray-200 text-gray-800' },
      'PENDING_APPROVAL': { label: 'Pending Approval', color: 'bg-yellow-200 text-yellow-800' },
      'APPROVED': { label: 'Approved', color: 'bg-green-200 text-green-800' },
      'REJECTED': { label: 'Rejected', color: 'bg-red-200 text-red-800' },
      'FUNDRAISING': { label: 'Fundraising', color: 'bg-blue-200 text-blue-800' },
      'FUNDRAISING_COMPLETED': { label: 'Fundraising Completed', color: 'bg-purple-200 text-purple-800' },
      'CANCELLED': { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
      'SUSPENDED': { label: 'Suspended', color: 'bg-orange-200 text-orange-800' },
    };
    
    return statusMap[status] || { label: status, color: 'bg-gray-200 text-gray-800' };
  };

  const statusDisplay = getStatusDisplay(projectStatus);

  // Determine if we're showing the update blog section
  const isUpdateBlogSection = currentSection === sections.length - 1;

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
              <span className="text-lg font-medium">Loading project...</span>
            </div>
          </div>
        )}
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
              <div className={`px-4 py-2 rounded-full ${statusDisplay.color}`}>
                {statusDisplay.label}
              </div>
            </div>
            
            {/* Editing Restrictions Notice */}
            {projectStatus === 'FUNDRAISING' && !isUpdateBlogSection && (
              <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Fundraising Editing Restrictions</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>Your project is currently in fundraising. During this stage:</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>You can edit basic information, project story and team information</li>
                        <li>You cannot edit fundraising information or rewards</li>
                        <li>You cannot edit core financial documents (SWOT, Business Model, Financial Info)</li>
                        <li>When saving changes, you&apos;ll be asked to post an update to inform your backers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {projectStatus === 'REJECTED' && !isUpdateBlogSection && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Project Rejected</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Your project has been rejected by our review team. Please make the necessary changes and resubmit for approval.</p>
                      <p className="mt-1">Saving your changes will automatically resubmit the project for review.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <ProjectCreationNavigation
                sections={sections}
                currentSection={currentSection}
                onSectionChange={goToSection}
                formData={formData}
                isEditMode={true}
              />
            </div>

            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">{sections[currentSection].name}</h2>
              {sections[currentSection].component}
            </div>

            {!isUpdateBlogSection && (
              <div className="flex justify-between">
                {currentSection > 0 && (
                  <button
                    onClick={goToPrevSection}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                  >
                    Back
                  </button>
                )}

                <div className="flex ml-auto space-x-2">
                  {projectStatus !== 'SUSPENDED' && projectStatus !== 'CANCELLED' && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving || isUpdateBlogSection}
                      className={`${
                        isSaving || isUpdateBlogSection ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                      } text-white font-semibold py-2 px-4 rounded-lg flex items-center`}
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : projectStatus === 'REJECTED' ? (
                        "Save & Resubmit"
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  )}

                  {currentSection < baseSections.length - 1 && (
                    <button
                      onClick={goToNextSection}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Update Modal for Fundraising Stage */}
        {showUpdateModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Post Project Update
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          You&apos;re making changes while your project is in fundraising. Please provide details about the changes for your backers.
                        </p>
                        <div className="mt-4">
                          <label htmlFor="update-note" className="block text-sm font-medium text-gray-700">
                            Update Details
                          </label>
                          <textarea
                            id="update-note"
                            rows={4}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Describe the changes you made and why..."
                            value={updateNote}
                            onChange={(e) => setUpdateNote(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={isPosting}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${isPosting ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm`}
                    onClick={handlePostUpdate}
                  >
                    {isPosting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Posting...
                      </>
                    ) : (
                      "Post Update & Save"
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowUpdateModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}

export default function EditProject() {
  return (
    <ProtectedRoute requiredRoles={['FOUNDER']}>
      <EditProjectPage />
    </ProtectedRoute>
  );
}