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

// Import the services
import { milestoneService } from 'src/services/milestoneService';
import { milestoneItemService } from 'src/services/milestoneItemService';

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
  const [isEditMode, setIsEditMode] = useState(false);
  const debugFormData = () => {
    console.log("DEBUG - Current form state:", {
      projectId: formData.projectId,
      fundraisingInfoProjectId: formData.fundraisingInfo?.projectId,
      phasesExist: Array.isArray(formData.fundraisingInfo?.phases),
      phasesLength: Array.isArray(formData.fundraisingInfo?.phases) ? formData.fundraisingInfo.phases.length : 0
    });
  };
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
    projectId: null,
    basicInfo: {
      projectId: null,
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
      projectId: null,
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

  // Add this effect to immediately set the projectId when available
  useEffect(() => {
    // Only run when projectId from router is available and valid
    if (projectId && typeof projectId === 'string') {
      console.log("Setting project ID from router:", projectId);

      // Update all places where projectId is needed
      setFormData(prevData => ({
        ...prevData,
        projectId: projectId,
        basicInfo: {
          ...prevData.basicInfo,
          projectId: projectId
        },
        fundraisingInfo: {
          ...prevData.fundraisingInfo,
          projectId: projectId
        },
        projectStory: {
          ...prevData.projectStory,
          projectId: projectId
        },
        // Update other sections as needed
      }));
    }
  }, [projectId]);

  // Load project data when projectId is available
  useEffect(() => {
    if (projectId && !authStatus.isLoading && authStatus.isAuthenticated) {
      console.log("Initial project ID from router query:", projectId);

      // Set projectId directly into formData to ensure it's available early
      setFormData(prevData => ({
        ...prevData,
        projectId: projectId
      }));

      // First load basic project data
      loadProjectData(projectId).then(() => {
        console.log("Basic project data loaded, now loading detailed data");

        // After basic data is loaded, load all related data
        loadAllProjectData(projectId);

        // Also load project updates
        loadProjectUpdates(projectId);
      }).catch(error => {
        console.error("Error in project data loading sequence:", error);
      });
    }
  }, [projectId, authStatus.isLoading, authStatus.isAuthenticated]);

  useEffect(() => {
    // This effect helps when projectId comes from API response
    const extractProjectIdFromRawData = () => {
      try {
        // Check local storage first for previously stored ID
        const storedId = localStorage.getItem('founderProjectId');

        // Try to extract from URL query
        const queryId = router.query.projectId;

        // If we have a stored or query ID, use it
        if (storedId || queryId) {
          const idToUse = queryId || storedId;
          console.log("Using project ID from URL/localStorage:", idToUse);

          setFormData(prevData => ({
            ...prevData,
            projectId: idToUse,
            fundraisingInfo: {
              ...prevData.fundraisingInfo,
              projectId: idToUse
            }
          }));

          // Force load phases with this ID
          loadProjectPhases(idToUse);
        }
      } catch (err) {
        console.error("Error extracting project ID:", err);
      }
    };

    // Run once when component mounts
    extractProjectIdFromRawData();
  }, []);

  // New function to load all project-related data
  const loadAllProjectData = async (projectId) => {
    try {
      console.log("Loading all data for project:", projectId);

      // Use a flag to track data loading status
      const dataLoadingPromises = [];

      // Load phases
      dataLoadingPromises.push(loadProjectPhases(projectId));

      // Load story
      dataLoadingPromises.push(loadProjectStory(projectId));

      // Load rewards/milestones
      dataLoadingPromises.push(loadProjectRewards(projectId));

      // Load documents
      dataLoadingPromises.push(loadProjectDocuments(projectId));

      // Wait for all data to load
      await Promise.all(dataLoadingPromises);

      console.log("All project data loaded successfully");
    } catch (error) {
      console.error("Error loading all project data:", error);
    }
  };

  // Load phases for the project
  const loadProjectPhases = async (projectId) => {
    try {
      console.log("Fetching phases for project ID:", projectId);

      if (!projectId) {
        console.error("No project ID provided for phase loading");

        // Try to get ID from other sources
        const fallbackId = router.query.projectId || localStorage.getItem('founderProjectId');
        if (fallbackId) {
          console.log("Using fallback project ID for phase loading:", fallbackId);
          return loadProjectPhases(fallbackId); // Retry with fallback ID
        }
        return;
      }

      // Force a re-set of projectId in the formData before loading phases
      setFormData(prevData => ({
        ...prevData,
        projectId: projectId,
        fundraisingInfo: {
          ...prevData.fundraisingInfo,
          projectId: projectId
        }
      }));

      // Explicitly call the API with project ID
      const phasesData = await projectService.getPhaseByProject(projectId);
      console.log("Phases data loaded:", phasesData);

      // Convert to array if needed
      const phasesArray = Array.isArray(phasesData) ? phasesData : [];
      console.log(`Setting ${phasesArray.length} phases for project ${projectId}`);

      // Update with phases data
      setFormData(prevData => {
        return {
          ...prevData,
          projectId: projectId,
          fundraisingInfo: {
            ...prevData.fundraisingInfo,
            projectId: projectId,
            startDate: phasesArray.length > 0 ? phasesArray[0]?.startDate || '' : '',
            phases: phasesArray
          }
        };
      });

      // Save project ID to localStorage for persistence
      localStorage.setItem('founderProjectId', projectId);

      // Call debug after updating
      setTimeout(() => debugFormData(), 0);

      return phasesArray;
    } catch (error) {
      console.error(`Error loading project phases for ID ${projectId}:`, error);

      // Still update with empty phases to avoid null reference
      setFormData(prevData => {
        console.log(`Setting empty phases array for project ${projectId} after error`);
        return {
          ...prevData,
          projectId: projectId,
          fundraisingInfo: {
            ...prevData.fundraisingInfo,
            projectId: projectId,
            phases: []
          }
        };
      });

      // Call debug after updating
      setTimeout(() => debugFormData(), 0);

      return [];
    }
  };

  // Load story data for the project
  const loadProjectStory = async (projectId) => {
    try {
      console.log("Fetching story data for project:", projectId);
      const storyData = await projectService.getProjectStoryByProjectId(projectId);
      console.log("Story data:", storyData);

      if (storyData) {
        // Make sure all possible ID fields are included
        const storyId =
          storyData.projectStoryId ||
          storyData.id ||
          (storyData.data ? storyData.data.projectStoryId || storyData.data.id : null);

        setFormData(prevData => ({
          ...prevData,
          projectStory: {
            id: storyId,
            projectStoryId: storyId,
            story: storyData.story || storyData.content || '',
            risks: storyData.risks || '',
            status: storyData.status || 'DRAFT',
            projectId: projectId
          }
        }));

        console.log("Set project story with ID:", storyId);
      }
    } catch (error) {
      console.error("Error loading project story:", error);
    }
  };

  // Load rewards/milestones for the project
  const loadProjectRewards = async (projectId) => {
    try {
      // First get phases to get their IDs
      console.log("Fetching rewards for project:", projectId);
      const phases = await projectService.getPhaseByProject(projectId);
      console.log("Phases for reward loading:", phases);

      if (!phases || !Array.isArray(phases) || phases.length === 0) {
        console.log("No phases found for milestone loading");
        return;
      }

      // For each phase, get its milestones
      console.log("Loading milestones for phases:", phases);
      const allRewards = [];

      for (const phase of phases) {
        try {
          if (!phase.id) {
            console.warn("Phase missing ID, skipping milestone retrieval", phase);
            continue;
          }

          console.log(`Getting milestones for phase ID: ${phase.id}`);
          const milestones = await milestoneService.getMilestonesByPhaseId(phase.id);
          console.log(`Milestones for phase ${phase.id}:`, milestones);

          if (milestones && Array.isArray(milestones)) {
            console.log(`Found ${milestones.length} milestones for phase ${phase.id}`);

            // Process each milestone
            for (const milestone of milestones) {
              // Add phase information to milestone
              const rewardWithPhase = {
                ...milestone,
                phaseId: phase.id,
                phaseName: phase.name || 'Phase'
              };

              // Load items for this milestone if it has an ID
              if (milestone.id) {
                const milestoneDetails = await milestoneService.getMilestoneById(milestone.id);
                console.log(`Milestone details for ID ${milestone.id}:`, milestoneDetails);

                if (milestoneDetails && milestoneDetails.items) {
                  rewardWithPhase.items = milestoneDetails.items;
                }
              }

              allRewards.push(rewardWithPhase);
            }
          }
        } catch (phaseError) {
          console.error(`Error loading milestones for phase ${phase.id}:`, phaseError);
        }
      }

      console.log("All rewards loaded:", allRewards);
      setFormData(prevData => ({
        ...prevData,
        rewardInfo: allRewards
      }));

    } catch (error) {
      console.error("Error loading project rewards:", error);
    }
  };

  // Load documents for the project
  const loadProjectDocuments = async (projectId) => {
    try {
      console.log("Fetching documents for project:", projectId);
      const documentsData = await projectService.getProjectDocumentsByProjectId(projectId);
      console.log("Documents data:", documentsData);

      if (documentsData && Array.isArray(documentsData)) {
        // Process documents into the required format
        const processedDocs = {
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
        };

        documentsData.forEach(doc => {
          const docType = doc.type?.toLowerCase();

          if (docType === 'swot_analysis') {
            processedDocs.mandatory.swotAnalysis = doc;
          } else if (docType === 'business_model_canvas') {
            processedDocs.mandatory.businessModelCanvas = doc;
          } else if (docType === 'business_plan') {
            processedDocs.mandatory.businessPlan = doc;
          } else if (docType === 'market_research') {
            processedDocs.mandatory.marketResearch = doc;
          } else if (docType === 'financial_information') {
            processedDocs.mandatory.financialInformation = doc;
          } else if (docType === 'project_media') {
            processedDocs.mandatory.projectMedia.push(doc);
          } else if (docType === 'customer_acquisition_plan') {
            processedDocs.optional.customerAcquisitionPlan = doc;
          } else if (docType === 'revenue_proof') {
            processedDocs.optional.revenueProof = doc;
          } else if (docType === 'vision_strategy') {
            processedDocs.optional.visionStrategy = doc;
          }
        });

        setFormData(prevData => ({
          ...prevData,
          requiredDocuments: processedDocs
        }));
      }
    } catch (error) {
      console.error("Error loading project documents:", error);
    }
  };

  // Load project updates
  const loadProjectUpdates = async (projectId) => {
    try {
      const updates = await projectService.getProjectUpdates(projectId);
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

  useEffect(() => {
    console.log("Component state:", {
      routerProjectId: projectId,
      formDataProjectId: formData.projectId,
      fundraisingInfoProjectId: formData.fundraisingInfo?.projectId,
      basicInfoProjectId: formData.basicInfo?.projectId
    });
  }, [projectId, formData.projectId, formData.fundraisingInfo?.projectId, formData.basicInfo?.projectId]);

  const loadProjectData = async (projectId) => {
    console.log("Loading project data for ID:", projectId);

    try {
      // Get project by ID directly
      const projectData = await projectService.getProjectById(projectId);
      console.log("API response for project:", projectData);

      if (projectData) {
        // Set project status
        setProjectStatus(projectData.status || 'DRAFT');

        // Store original data for comparison
        setOriginalData(projectData);

        // Set edit mode
        setIsEditMode(true);

        // Store the projectId in localStorage for persistence
        localStorage.setItem('founderProjectId', projectId);

        // Update form data with project details
        setFormData(prevData => ({
          ...prevData,
          projectId: projectId,
          basicInfo: {
            ...prevData.basicInfo,
            projectId: projectId,
            title: projectData.title || '',
            shortDescription: projectData.description || '',
            projectDescription: projectData.description || '',
            category: projectData.category?.id || '',
            categoryId: projectData.category?.id || '',
            subCategoryIds: projectData.subCategories?.map(sub => sub.id) || [],
            location: projectData.location || '',
            projectLocation: projectData.location || '',
            projectUrl: projectData.projectUrl || '',
            mainSocialMediaUrl: projectData.mainSocialMediaUrl || '',
            projectVideoDemo: projectData.projectVideoDemo || '',
            totalTargetAmount: projectData.totalTargetAmount || 1000,
            isClassPotential: projectData.isClassPotential !== undefined
              ? projectData.isClassPotential
              : false,
            status: projectData.status || 'DRAFT',
            projectImage: projectData.projectImage || null
          },
          // Initialize fundraisingInfo with projectId to avoid null reference issues
          fundraisingInfo: {
            ...prevData.fundraisingInfo,
            projectId: projectId,
            startDate: '',
            phases: []
          }
        }));

        return projectData;
      } else {
        console.error("No project found with ID:", projectId);
        return null;
      }
    } catch (error) {
      console.error("Error loading project data:", error);
      alert(`Error loading project: ${error.message || 'Unknown error'}`);
      throw error;
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

    // Make sure we preserve projectId in the updated data
    let updatedData = data;
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      updatedData = {
        ...data,
        projectId: projectId || formData.projectId
      };
    }

    // Log the section being updated with current projectId
    console.log(`Updating ${section} with projectId:`, projectId || formData.projectId);

    // Update form data
    setFormData(prevData => {
      // For rewardInfo, prevent unnecessary updates if data is the same
      if (section === 'rewardInfo') {
        // Deep comparison would be better, but for simple check:
        if (JSON.stringify(prevData.rewardInfo) === JSON.stringify(updatedData)) {
          console.log('Skipping rewardInfo update - no changes detected');
          return prevData; // No change needed
        }
      }

      // Special handling for fundraisingInfo to ensure projectId and phases are included
      if (section === 'fundraisingInfo') {
        // Ensure phases is always an array
        const phases = Array.isArray(updatedData.phases) ? updatedData.phases : [];
        console.log(`Updating fundraisingInfo with ${phases.length} phases`);

        return {
          ...prevData,
          projectId: projectId || prevData.projectId,
          [section]: {
            ...updatedData,
            projectId: projectId || prevData.projectId,
            phases: phases
          }
        };
      }

      // Special handling for basicInfo (unchanged)
      if (section === 'basicInfo') {
        // Ensure all field mappings are properly maintained
        const updatedBasicInfo = {
          ...data,
          projectId: projectId || data.projectId || prevData.projectId,
          // Handle potential field name differences
          category: data.category || data.categoryId,
          categoryId: data.categoryId || data.category,
          location: data.location || data.projectLocation,
          projectLocation: data.projectLocation || data.location,
          shortDescription: data.shortDescription || data.projectDescription,
          projectDescription: data.projectDescription || data.shortDescription,
          // Explicitly include the projectImage
          projectImage: data.projectImage || prevData.basicInfo?.projectImage,
        };

        console.log("Updated basicInfo with projectImage:", updatedBasicInfo.projectImage);

        return {
          ...prevData,
          projectId: projectId || prevData.projectId,
          [section]: updatedBasicInfo,
          // Also store projectImage at the top level for easier access
          projectImage: data.projectImage || prevData.projectImage
        };
      }

      // For other sections
      return {
        ...prevData,
        projectId: projectId || prevData.projectId,
        [section]: updatedData
      };
    });
    setTimeout(() => debugFormData(), 0);
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

      // Get the project ID
      const projectId = formData.projectId;

      if (!projectId) {
        alert("No project ID found. Please save your project before submitting.");
        return;
      }

      console.log("Saving project with ID:", projectId);

      // If project is in REJECTED status and now editing, change to PENDING_APPROVAL
      if (projectStatus === 'REJECTED') {
        const confirmSubmit = confirm(
          "Once submitted, your project will be reviewed by our team. " +
          "You won't be able to make changes during the review process. " +
          "Are you sure you want to submit your project now?"
        );

        if (!confirmSubmit) {
          setIsSaving(false);
          return;
        }

        // Save each section first
        await saveAllSections(projectId);

        console.log("Resubmitting rejected project");
        await projectService.submitProject(projectId);
        setProjectStatus('PENDING_APPROVAL');

        // Show success message
        alert('Your project has been successfully submitted for review! You will be notified when the review is complete.');
      } else {
        // Just save all sections
        await saveAllSections(projectId);
        alert("Project updated successfully!");
      }

      // Reset the update required flag
      setUpdateRequired(false);

      // Reload project data
      await loadProjectData(projectId);
      await loadAllProjectData(projectId);

    } catch (error) {
      console.error("Error saving project:", error);
      alert(`Failed to save project: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Save all sections of the project
  const saveAllSections = async (projectId) => {
    console.log("Saving all sections for project:", projectId);

    try {
      // Save basic info
      if (editRestrictions.basicInfo) {
        await projectService.updateProjectInfo(projectId, formData.basicInfo);
      }

      // Save fundraising info if allowed
      if (editRestrictions.fundraisingInfo) {
        // Update existing phases
        console.log("Saving phases for project:", projectId);
        console.log("Current phases in formData:", formData.fundraisingInfo.phases);

        for (const phase of formData.fundraisingInfo.phases) {
          try {
            if (phase.id) {
              console.log("Updating existing phase:", phase.id, phase);
              await projectService.updateProjectPhase(phase.id, {
                ...phase,
                projectId: projectId
              });
            } else {
              console.log("Creating new phase for project:", projectId, phase);
              const newPhase = await projectService.createProjectPhase(projectId, {
                ...phase,
                projectId: projectId
              });
              console.log("Created new phase:", newPhase);
            }
          } catch (phaseError) {
            console.error("Error saving phase:", phaseError);
          }
        }
      }

      // Save rewards if allowed
      if (editRestrictions.rewardInfo) {
        console.log("Saving rewards:", formData.rewardInfo);

        for (const reward of formData.rewardInfo) {
          try {
            if (reward.id) {
              // Update existing reward
              console.log(`Updating existing milestone: ${reward.id}`, reward);
              await milestoneService.updateMilestone(reward.id, reward);

              // Update its items
              if (reward.items && Array.isArray(reward.items)) {
                console.log(`Processing ${reward.items.length} items for milestone ${reward.id}`);

                for (const item of reward.items) {
                  if (item.id) {
                    console.log(`Updating existing item: ${item.id}`, item);
                    await milestoneItemService.updateMilestoneItem(item.id, item);
                  } else {
                    console.log(`Creating new item for milestone: ${reward.id}`, item);
                    await milestoneItemService.createMilestoneItem(reward.id, item);
                  }
                }
              }
            } else if (reward.phaseId) {
              // Create new reward
              console.log(`Creating new milestone for phase: ${reward.phaseId}`, reward);
              const newReward = await milestoneService.createMilestoneForPhase(reward.phaseId, reward);

              // Create its items
              if (newReward && newReward.id && reward.items && Array.isArray(reward.items)) {
                console.log(`Creating ${reward.items.length} items for new milestone ${newReward.id}`);

                for (const item of reward.items) {
                  await milestoneItemService.createMilestoneItem(newReward.id, item);
                }
              }
            } else {
              console.warn("Cannot save reward without id or phaseId:", reward);
            }
          } catch (rewardError) {
            console.error("Error saving reward:", rewardError);
            throw rewardError;
          }
        }
      }

      // Save project story if allowed
      if (editRestrictions.projectStory) {
        if (formData.projectStory.id) {
          await projectService.updateProjectStory(
            formData.projectStory.id,
            formData.projectStory
          );
        } else {
          await projectService.createProjectStory(projectId, formData.projectStory);
        }
      }

      // Save founder profile if allowed
      if (editRestrictions.founderProfile) {
        await projectService.updateFounderProfile(projectId, formData.founderProfile);
      }

      // Save documents if allowed
      if (editRestrictions.requiredDocuments) {
        // Handle document restrictions during fundraising
        if (projectStatus === 'FUNDRAISING') {
          const safeDocuments = { ...formData.requiredDocuments };

          // Keep original values for restricted documents
          for (const docType of restrictedDocuments) {
            if (originalData?.requiredDocuments?.mandatory?.[docType]) {
              safeDocuments.mandatory[docType] = originalData.requiredDocuments.mandatory[docType];
            }
          }

          await projectService.updateProjectDocuments(projectId, safeDocuments);
        } else {
          await projectService.updateProjectDocuments(projectId, formData.requiredDocuments);
        }
      }

      console.log("All sections saved successfully");
    } catch (error) {
      console.error("Error saving project sections:", error);
      throw error;
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
        projectId={formData.projectId}
      />
    },
    {
      id: 'fundraising',
      name: 'Fundraising Information',
      component: <FundraisingInformation
        formData={{
          projectId: projectId || formData.projectId || router.query.projectId, // Try all possible sources
          startDate: formData.fundraisingInfo?.startDate || '',
          phases: Array.isArray(formData.fundraisingInfo?.phases) ? formData.fundraisingInfo.phases : []
        }}
        updateFormData={(data) => handleUpdateFormData('fundraisingInfo', data)}
        projectId={projectId || formData.projectId || router.query.projectId} // Try all possible sources
        readOnly={!editRestrictions.fundraisingInfo}
      />
    },
    {
      id: 'rewards',
      name: 'Reward Information',
      component: <RewardInformation
        formData={formData.rewardInfo}
        projectData={{
          ...formData.fundraisingInfo,
          projectId: formData.projectId
        }}
        updateFormData={(data) => handleUpdateFormData('rewardInfo', data)}
        readOnly={!editRestrictions.rewardInfo}
        projectId={formData.projectId}
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
        projectId={formData.projectId}
      />
    )
  };

  // Create full sections array with update blog section
  const sections = [...baseSections, updateBlogSection];

  // Get status label and color
  const getStatusDisplay = (status) => {
    // First normalize the status to handle case differences
    const normalizedStatus = status?.toUpperCase() || 'DRAFT';

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

    console.log("Getting status display for:", normalizedStatus);

    return statusMap[normalizedStatus] || {
      label: status || 'Unknown Status',
      color: 'bg-gray-200 text-gray-800'
    };
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
                      className={`${isSaving || isUpdateBlogSection ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
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