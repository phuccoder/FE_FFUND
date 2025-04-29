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
import updatePostService from 'src/services/updatePostService';
import Header from '@/components/Header/Header';
import PageTitle from '@/components/Reuseable/PageTitle';
import ProjectEvaluationPoint from '@/components/CreateProject/ProjectEvaluationPoint';

function EditProjectPage() {
  const router = useRouter();
  const { projectId: routerProjectId } = router.query;

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
  const [userRole, setUserRole] = useState(null);

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


  const updateAllProjectIds = (id) => {
    if (!id) {
      console.warn("Attempted to update project IDs with null/undefined value");
      return;
    }

    console.log("Updating all project IDs to:", id);


    // Create a more thorough update across all state properties
    setFormData(prevData => {
      // Create a deep clone of the existing data
      const updatedData = JSON.parse(JSON.stringify(prevData));

      // Set top-level projectId
      updatedData.projectId = id;

      // Set basic info projectId
      if (updatedData.basicInfo) {
        updatedData.basicInfo.projectId = id;
      }

      // Set fundraising info projectId
      if (updatedData.fundraisingInfo) {
        updatedData.fundraisingInfo.projectId = id;

        // Set phase projectIds
        if (Array.isArray(updatedData.fundraisingInfo.phases)) {
          updatedData.fundraisingInfo.phases = updatedData.fundraisingInfo.phases.map(phase => ({
            ...phase,
            projectId: id
          }));
        }
      }

      // Set project story projectId
      if (updatedData.projectStory) {
        updatedData.projectStory.projectId = id;
      }

      // Set reward info projectIds
      if (Array.isArray(updatedData.rewardInfo)) {
        updatedData.rewardInfo = updatedData.rewardInfo.map(reward => ({
          ...reward,
          projectId: id
        }));
      }

      return updatedData;
    });

    // Log the update for debugging
    setTimeout(() => {
      console.log("Form data after ID update:", {
        mainProjectId: formData.projectId,
        basicInfoProjectId: formData.basicInfo?.projectId,
        fundraisingInfoProjectId: formData.fundraisingInfo?.projectId,
        phases: formData.fundraisingInfo?.phases?.length || 0
      });
    }, 100);
  };

  const ensureProjectId = () => {
    // Check all possible sources for a project ID
    let id = null;

    // First check URL query parameter (highest priority)
    if (router.query && router.query.projectId) {
      id = router.query.projectId;
      console.log("Using project ID from URL query:", id);
    }

    // Then check if we already have it in form state
    if (!id && formData && formData.projectId) {
      id = formData.projectId;
      console.log("Using project ID from form state:", id);
    }

    // Check forms' nested objects
    if (!id && formData?.basicInfo?.projectId) {
      id = formData.basicInfo.projectId;
      console.log("Using project ID from basicInfo:", id);
    }

    // Finally check localStorage
    if (!id && typeof window !== 'undefined') {
      id = localStorage.getItem('founderProjectId');
      if (id) {
        console.log("Using project ID from localStorage:", id);
      }
    }

    // If we found an ID from any source, ensure it's consistently used everywhere
    if (id) {
      updateAllProjectIds(id);
    }

    return id;
  };

  useEffect(() => {
    if (router.isReady) {
      const id = router.query.projectId || ensureProjectId();

      if (id && !authStatus.isLoading && authStatus.isAuthenticated) {
        console.log("Loading project with ID:", id);

        if (typeof window !== 'undefined') {
          localStorage.setItem('founderProjectId', id);
        }

        updateAllProjectIds(id);

        loadProjectData(id).then(() => {
          console.log("Basic project data loaded, now loading detailed data");

          loadAllProjectData(id);

          loadProjectUpdates(id);
        }).catch(error => {
          console.error("Error in project data loading sequence:", error);
        });
      }
    }
  }, [router.isReady, authStatus.isLoading, authStatus.isAuthenticated]);

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

  useEffect(() => {
    const teamRole = localStorage.getItem('teamRole');
    console.log("User teamRole:", teamRole);
    setUserRole(teamRole);

  }, [authStatus.isAuthenticated, authStatus.isLoading]);

  useEffect(() => {
    const initializeProject = async () => {
      try {
        // Only initialize once auth is ready
        if (authStatus.isLoading || !authStatus.isAuthenticated) return;

        console.log("Initializing project...");

        // Get project ID from all possible sources
        const projectId = await getProjectIdFromAllSources();
        console.log("Initial project ID from all sources:", projectId);

        if (!projectId) {
          console.warn("No project ID found from any source");
          return;
        }

        // Update all project IDs in state
        updateAllProjectIds(projectId);

        // Load project data with this ID
        await loadProjectData(projectId);

        // After basic data is loaded, get all related data
        await loadAllProjectData(projectId);

        // Also load project updates
        await loadProjectUpdates(projectId);

        console.log("Project initialization complete with ID:", projectId);
      } catch (error) {
        console.error("Error during project initialization:", error);
      }
    };

    initializeProject();
  }, [router.isReady, authStatus.isAuthenticated, authStatus.isLoading]);

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

          // Use the updateAllProjectIds function to ensure consistency
          updateAllProjectIds(idToUse);

          // Force load phases with this ID if needed
          if (!formData.fundraisingInfo?.phases || formData.fundraisingInfo.phases.length === 0) {
            loadProjectPhases(idToUse);
          }
        } else if (formData.basicInfo?.projectId) {
          // Use ID from basicInfo if available
          console.log("Using project ID from basicInfo:", formData.basicInfo.projectId);
          updateAllProjectIds(formData.basicInfo.projectId);
        }
      } catch (err) {
        console.error("Error extracting project ID:", err);
      }
    };

    // Run once when component mounts
    extractProjectIdFromRawData();
  }, [router.query]);

  const getProjectIdFromAllSources = async () => {
    // 1. Try URL query parameter (highest priority)
    if (router.isReady && router.query.projectId) {
      return router.query.projectId;
    }

    // 2. Try localStorage
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('founderProjectId');
      if (storedId) return storedId;
    }

    // 3. Try to get latest project from API directly
    try {
      const response = await projectService.getCurrentProjectByFounder();

      // Handle different API response formats
      if (Array.isArray(response) && response.length > 0) {
        return response[0].projectId || response[0].id;
      }
      else if (response && (response.projectId || response.id)) {
        return response.projectId || response.id;
      }
      else if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0].projectId || response.data[0].id;
      }
    } catch (err) {
      console.error("Error getting projects:", err);
    }

    return null;
  };

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
        const fallbackId = ensureProjectId();
        if (fallbackId) {
          console.log("Using fallback project ID for phase loading:", fallbackId);
          return loadProjectPhases(fallbackId); // Retry with fallback ID
        }
        return [];
      }

      // Explicitly call the API with project ID
      const phasesData = await projectService.getPhaseByProject(projectId);
      console.log("Phases data loaded:", phasesData);

      // Convert to array if needed
      const phasesArray = Array.isArray(phasesData) ? phasesData : [];
      console.log(`Setting ${phasesArray.length} phases for project ${projectId}`);

      // Ensure each phase has the correct projectId
      const processedPhasesArray = phasesArray.map(phase => ({
        ...phase,
        projectId: projectId
      }));

      // Update with phases data, ensuring consistent project IDs
      setFormData(prevData => {
        const updatedData = {
          ...prevData,
          projectId: projectId,
          fundraisingInfo: {
            ...prevData.fundraisingInfo,
            projectId: projectId,
            startDate: processedPhasesArray.length > 0 ? processedPhasesArray[0]?.startDate || '' : '',
            phases: processedPhasesArray
          }
        };

        return updatedData;
      });

      // Debug after updating
      setTimeout(() => debugFormData(), 0);
      return processedPhasesArray;
    } catch (error) {
      console.error(`Error loading project phases for ID ${projectId}:`, error);

      // Still update with empty phases to avoid null reference, but maintain projectId
      setFormData(prevData => ({
        ...prevData,
        projectId: projectId,
        fundraisingInfo: {
          ...prevData.fundraisingInfo,
          projectId: projectId,
          phases: []
        }
      }));

      // Debug after updating
      setTimeout(() => debugFormData(), 0);
      return [];
    }
  };

  useEffect(() => {
    console.log("Project Story Data for rendering:", {
      id: formData.projectStory?.id,
      projectStoryId: formData.projectStory?.projectStoryId,
      blocksExist: Array.isArray(formData.projectStory?.blocks),
      blocksCount: Array.isArray(formData.projectStory?.blocks) ? formData.projectStory.blocks.length : 0,
      storyContent: formData.projectStory?.story ? formData.projectStory.story.substring(0, 50) + "..." : "(empty)",
      risksContent: formData.projectStory?.risks ? formData.projectStory.risks.substring(0, 50) + "..." : "(empty)"
    });
  }, [formData.projectStory]);

  // Fix 2: Update the loadProjectStory function to properly handle block-based content
  const loadProjectStory = async (projectId) => {
    try {
      console.log("Fetching story data for project:", projectId);

      if (!projectId) {
        console.error("No project ID provided for story loading");
        return null;
      }

      const storyData = await projectService.getProjectStoryByProjectId(projectId);
      console.log("Story data received from API:", storyData);

      if (!storyData) {
        console.warn("No story data returned from API for project:", projectId);
        return null;
      }

      // Handle block-based story structure
      if (storyData.blocks && Array.isArray(storyData.blocks)) {
        console.log("Processing block-based story data with", storyData.blocks.length, "blocks");

        // Extract story content from blocks
        let storyContent = '';
        let risksContent = '';

        // Find the risks section heading index
        const risksStartIndex = storyData.blocks.findIndex(block =>
          block.type === 'HEADING' &&
          block.content &&
          block.content.toLowerCase().includes('risk'));

        if (risksStartIndex !== -1) {
          // Process blocks before risks section as story content
          const storyBlocks = storyData.blocks.slice(0, risksStartIndex);
          storyContent = storyBlocks.map(block => block.content || '').join('\n\n');

          // Process blocks after risks section as risks content
          const risksBlocks = storyData.blocks.slice(risksStartIndex + 1);
          risksContent = risksBlocks.map(block => block.content || '').join('\n\n');
        } else {
          // If no risks section found, treat all blocks as story content
          storyContent = storyData.blocks.map(block => block.content || '').join('\n\n');
        }

        const processedStoryData = {
          id: storyData.projectStoryId,
          projectStoryId: storyData.projectStoryId,
          story: storyContent || '',
          risks: risksContent || '',
          status: storyData.status || 'DRAFT',
          projectId: storyData.projectId || projectId,
          blocks: storyData.blocks, // Keep all blocks for reference
          version: storyData.version
        };

        console.log("Processed block-based story data:", processedStoryData);

        // Update form data with story information
        setFormData(prevData => ({
          ...prevData,
          projectStory: processedStoryData
        }));

        return processedStoryData;
      }

      // Handle simple text-based story format
      const storyId = storyData.projectStoryId || storyData.id || null;

      const processedStoryData = {
        id: storyId,
        projectStoryId: storyId,
        story: storyData.story || storyData.content || '',
        risks: storyData.risks || '',
        status: storyData.status || 'DRAFT',
        projectId: storyData.projectId || projectId
      };

      console.log("Processed simple story data:", processedStoryData);

      // Update form data with story information
      setFormData(prevData => ({
        ...prevData,
        projectStory: processedStoryData
      }));

      return processedStoryData;
    } catch (error) {
      console.error("Error loading project story:", error);
      return null;
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
      if (!projectId) {
        console.error("No project ID provided for loading updates");
        return;
      }

      console.log("Loading updates for project:", projectId);
      const updates = await updatePostService.getUpdatePostByProjectId(projectId);

      if (updates && Array.isArray(updates)) {
        setExistingUpdates(updates.map(update => ({
          id: update.id,
          title: update.title || '',
          content: update.content || '',
          postContent: update.postContent || update.content || '', // Support both field names
          date: update.createdAt || new Date().toISOString(),
          images: update.images || []
        })));

        console.log(`Loaded ${updates.length} updates for project ${projectId}`);
      } else {
        console.log("No updates found for project:", projectId);
        setExistingUpdates([]);
      }
    } catch (error) {
      console.error("Error loading project updates:", error);
      setExistingUpdates([]);
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
      } else if (projectStatus === 'APPROVED') {
        // When approved but not yet in fundraising, disable fundraising info
        restrictions.fundraisingInfo = false;
        restrictions.rewardInfo = false;
      } else if (projectStatus === 'PENDING_APPROVAL' || projectStatus === 'REJECTED') {
        // While waiting for approval or after rejection, allow editing all sections
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
      console.log("Updated edit restrictions based on status:", projectStatus, restrictions);
    }
  }, [projectStatus]);

  useEffect(() => {
    console.log("Component state:", {
      routerProjectId, // Use routerProjectId instead of undefined projectId
      formDataProjectId: formData.projectId,
      fundraisingInfoProjectId: formData.fundraisingInfo?.projectId,
      basicInfoProjectId: formData.basicInfo?.projectId
    });
  }, [routerProjectId, formData.projectId, formData.fundraisingInfo?.projectId, formData.basicInfo?.projectId]);

  const loadProjectData = async (projectId) => {
    try {
      console.log("Loading project data with ID:", projectId);

      // If no projectId is provided, try to find one from available sources
      if (!projectId) {
        projectId = await getProjectIdFromAllSources();
        if (!projectId) {
          console.error("No project ID available for loading data");
          return null;
        }
      }

      // First, immediately store the project ID to ensure it's available
      updateAllProjectIds(projectId);

      // Try to get the project directly by ID first (more reliable)
      try {
        const directProjectData = await projectService.getProjectById(projectId);
        if (directProjectData) {
          console.log("Successfully loaded project directly by ID:", directProjectData);

          // Extract the project ID to ensure consistency
          const extractedProjectId = directProjectData.projectId || directProjectData.id;

          // Update all project IDs in state
          updateAllProjectIds(extractedProjectId);

          // Set project status
          setProjectStatus(directProjectData.status || 'DRAFT');

          // Store original data for comparison
          setOriginalData(directProjectData);

          // Set edit mode
          setIsEditMode(true);

          // Update form data with project details
          const updateFormWithDirectData = {
            projectId: extractedProjectId,
            basicInfo: {
              projectId: extractedProjectId,
              title: directProjectData.title || '',
              shortDescription: directProjectData.description || directProjectData.projectDescription || '',
              projectDescription: directProjectData.description || directProjectData.projectDescription || '',
              category: directProjectData.category?.id || '',
              categoryId: directProjectData.category?.id || '',
              subCategoryIds: directProjectData.subCategories?.map(sub => sub.id) || [],
              location: directProjectData.location || directProjectData.projectLocation || '',
              projectLocation: directProjectData.location || directProjectData.projectLocation || '',
              projectUrl: directProjectData.projectUrl || '',
              mainSocialMediaUrl: directProjectData.mainSocialMediaUrl || '',
              projectVideoDemo: directProjectData.projectVideoDemo || '',
              totalTargetAmount: directProjectData.totalTargetAmount || 1000,
              isClassPotential: directProjectData.isClassPotential !== undefined
                ? directProjectData.isClassPotential
                : false,
              status: directProjectData.status || 'DRAFT',
              projectImage: directProjectData.projectImage || null
            }
          };

          setFormData(prevData => ({
            ...prevData,
            ...updateFormWithDirectData
          }));

          return directProjectData;
        }
      } catch (directError) {
        console.warn("Could not load project directly, falling back to founder projects:", directError);
      }

      // Get projects from founder API
      const response = await projectService.getCurrentProjectByFounder();
      console.log("Projects from founder API:", response);

      let projectData = null;

      // Find the specific project with our ID in the response
      if (Array.isArray(response)) {
        projectData = response.find(project =>
          project.id == projectId || project.projectId == projectId
        );

        if (!projectData && response.length > 0) {
          // If no match but we have projects, take the first one
          projectData = response[0];
          console.log("No exact match found, using first project:", projectData);
        }
      } else if (response && response.data && Array.isArray(response.data)) {
        // Handle nested array response
        projectData = response.data.find(project =>
          project.id == projectId || project.projectId == projectId
        );
        if (!projectData && response.data.length > 0) {
          projectData = response.data[0];
        }
      } else if (response && (response.projectId || response.id)) {
        // Single object response
        projectData = response;
      } else {
        console.error("Could not find any projects in the API response");
        return null;
      }

      if (!projectData) {
        console.error("No project found in the response");
        return null;
      }

      // Extract the project ID that will be used consistently throughout the app
      const extractedProjectId = projectData.projectId || projectData.id;

      if (!extractedProjectId) {
        console.error("No project ID found in the response");
        return null;
      }

      // Ensure consistent ID usage
      updateAllProjectIds(extractedProjectId);

      // Set project status
      const status = projectData.status || 'DRAFT';
      setProjectStatus(status);

      // Store original data for comparison
      setOriginalData(projectData);

      // Set edit mode
      setIsEditMode(true);

      // Update the form data with details from projectData
      setFormData(prevData => ({
        ...prevData,
        projectId: extractedProjectId,
        basicInfo: {
          ...prevData.basicInfo,
          projectId: extractedProjectId,
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
          status: status,
          projectImage: projectData.projectImage || null
        },
        fundraisingInfo: {
          ...prevData.fundraisingInfo,
          projectId: extractedProjectId,
          startDate: '',
          phases: Array.isArray(prevData.fundraisingInfo?.phases)
            ? prevData.fundraisingInfo.phases.map(phase => ({
              ...phase,
              projectId: extractedProjectId
            }))
            : []
        }
      }));

      console.log("Project data loaded successfully with ID:", extractedProjectId);
      return projectData;
    } catch (error) {
      console.error("Error loading project data:", error);
      alert(`Error loading project: ${error.message || 'Unknown error'}`);
      throw error;
    }
  };

  const isMilestoneEditable = (rewardData) => {
    // If we don't have a phaseId, it's a new milestone that hasn't been saved yet
    if (!rewardData.phaseId) return true;

    // Find the phase this milestone belongs to
    const phase = formData.fundraisingInfo?.phases?.find(p => p.id === rewardData.phaseId);

    // Only allow editing if the phase status is PLAN
    return phase && phase.status === 'PLAN';
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

    // Special check for rewardInfo to enforce phase status restrictions
    if (section === 'rewardInfo' && Array.isArray(data)) {
      // If any of the rewards being updated belong to a non-PLAN phase, show warning
      const nonEditableRewards = data.filter(reward => reward.id && !isMilestoneEditable(reward));

      if (nonEditableRewards.length > 0) {

        // Filter out the non-editable rewards from the data
        const editableRewards = data.filter(reward => !reward.id || isMilestoneEditable(reward));

        // Get the current rewards that are not editable to preserve them
        const currentNonEditableRewards = formData.rewardInfo.filter(reward =>
          reward.id && !isMilestoneEditable(reward)
        );

        // Combine editable updates with preserved non-editable rewards
        data = [...editableRewards, ...currentNonEditableRewards];
      }
    }

    let updatedData = data;
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      updatedData = {
        ...data,
        projectId: formData.projectId
      };
    }

    // Log the section being updated with current projectId
    console.log(`Updating ${section} with projectId:`, formData.projectId);

    // Update form data
    setFormData(prevData => {
      // For rewardInfo, prevent unnecessary updates if data is the same
      if (section === 'rewardInfo') {
        // Deep comparison would be better, but for simple check:
        if (JSON.stringify(prevData.rewardInfo) === JSON.stringify(updatedData)) {
          console.log('Skipping rewardInfo update - no changes detected');
          return prevData;
        }
      }

      // Special handling for fundraisingInfo to ensure projectId and phases are included
      if (section === 'fundraisingInfo') {
        // Ensure phases is always an array
        const phases = Array.isArray(updatedData.phases) ? updatedData.phases : [];
        console.log(`Updating fundraisingInfo with ${phases.length} phases`);

        return {
          ...prevData,
          projectId: prevData.projectId,
          [section]: {
            ...updatedData,
            projectId: prevData.projectId,
            phases: phases
          }
        };
      }

      // Special handling for basicInfo (unchanged)
      if (section === 'basicInfo') {
        // Ensure all field mappings are properly maintained
        const updatedBasicInfo = {
          ...data,
          projectId: data.projectId || prevData.projectId,
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
          projectId: prevData.projectId,
          [section]: updatedBasicInfo,
          // Also store projectImage at the top level for easier access
          projectImage: data.projectImage || prevData.projectImage
        };
      }

      // For other sections
      return {
        ...prevData,
        projectId: prevData.projectId,
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

      if (userRole !== 'LEADER') {
        alert("Only users with the Leader role can save and submit projects.");
        return;
      }

      setIsSaving(true);
      console.log("Current project status before save:", projectStatus);

      // If update is required but not posted, show the update modal
      if (updateRequired && projectStatus === 'FUNDRAISING') {
        setShowUpdateModal(true);
        setIsSaving(false);
        return;
      }

      // Get the project ID using our reliable method
      const projectId = ensureProjectId();

      if (!projectId) {
        alert("No project ID found. Please save your project before submitting.");
        setIsSaving(false);
        return;
      }

      console.log("Saving project with ID:", projectId);

      // Skip the section-by-section save and directly call submitProject
      console.log("Submitting project for review with ID:", projectId);
      await projectService.submitProject(projectId);

      // Update status in local state to PENDING_APPROVAL regardless of current status
      setProjectStatus('PENDING_APPROVAL');

      // Show success message
      alert('Your project has been successfully submitted for review! You will be notified when the review is complete.');

      // Reset the update required flag
      setUpdateRequired(false);

      // Reload project data to ensure UI is up to date
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
      await updatePostService.createUpdatePost(formData.projectId, {
        title: "Project Update",
        postContent: updateNote,
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

  const handleSaveUpdate = async (update) => {
    try {
      // Check if this is a response from the component's internal API call
      if (update.success && update.data) {
        console.log("Update already saved by component, refreshing data");

        // Refresh the list of updates without making another API call
        await loadProjectUpdates(formData.projectId);

        return true;
      }

      // Original implementation for when direct data is provided
      if (!formData.projectId) {
        const id = ensureProjectId();
        if (!id) {
          alert("No project ID found. Cannot post update.");
          return false;
        }
      }

      console.log("Posting update for project:", formData.projectId);

      const createdUpdate = await updatePostService.createUpdatePost(formData.projectId, {
        title: update.title,
        postContent: update.postContent,
      });

      // If update has images and was created successfully
      if (update.images && update.images.length > 0 && createdUpdate && createdUpdate.id) {
        console.log("Uploading images for update:", createdUpdate.id);

        // Upload each image and get URLs
        for (const image of update.images) {
          try {
            await updatePostService.uploadImage(createdUpdate.id, image);
          } catch (imageError) {
            console.error("Error uploading image:", imageError);
            // Continue with other images even if one fails
          }
        }
      }

      // Refresh the list of updates
      await loadProjectUpdates(formData.projectId);

      // Show success message
      alert("Update posted successfully!");


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

  const isStatusAllowedForEditing = (status) => {
    if (!status) return false; // Don't allow if no status (redirect to create-project)

    // Normalize the status to handle case differences
    const normalizedStatus = status.toUpperCase();

    // List of allowed statuses (DRAFT excluded)
    const allowedStatuses = [
      'PENDING_APPROVAL',
      'APPROVED',
      'FUNDRAISING_COMPLETED',
      'REJECTED' // Including REJECTED so users can fix and resubmit
    ];

    return allowedStatuses.includes(normalizedStatus);
  };

  // Then replace the existing isEditingRestricted check with this:
  const isEditingRestricted = () => {
    // First normalize the status
    const normalizedStatus = projectStatus ? projectStatus.toUpperCase() : '';

    console.log("Checking edit restrictions:", {
      status: normalizedStatus,
      isAllowedStatus: isStatusAllowedForEditing(projectStatus)
    });

    // If it's DRAFT, restrict editing in this page
    if (normalizedStatus === 'DRAFT') {
      return true;
    }

    // If it's not in our allowed list, restrict editing
    return !isStatusAllowedForEditing(projectStatus);
  };

  // Update the conditional render component:
  if (isEditingRestricted() && !authStatus.isLoading) {
    return (
      <Layout>
        <Header />
        <PageTitle title="Edit Project" />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Editing Restricted
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                      <p>
                        This project cannot be edited because its current status is <span className="font-semibold">{projectStatus}</span>.
                      </p>
                      <div className="mt-3">
                        <p className="text-gray-700">
                          {projectStatus === 'DRAFT' ? (
                            <>
                              Draft projects should be edited in the Create Project page.
                            </>
                          ) : projectStatus === 'FUNDRAISING' ? (
                            <>
                              This project is currently in the fundraising stage. Only project updates are allowed at this time.
                            </>
                          ) : projectStatus === 'COMPLETED' ? (
                            <>
                              This project has been completed. You can view project details but cannot edit information.
                            </>
                          ) : projectStatus === 'SUSPENDED' ? (
                            <>
                              This project has been suspended. Please contact support for more information.
                            </>
                          ) : projectStatus === 'CANCELLED' ? (
                            <>
                              This project has been cancelled and cannot be edited.
                            </>
                          ) : (
                            <>
                              Projects with status &quot;{projectStatus}&quot; cannot be edited.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex">
                      <button
                        type="button"
                        onClick={() => router.push(`/`)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                      >
                        Back to Home
                      </button>
                      {projectStatus === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() => router.push('/create-project')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Go to Create Project
                        </button>
                      )}
                      {projectStatus === 'FUNDRAISING' && (
                        <button
                          type="button"
                          onClick={() => goToSection(sections.length - 1)} // Go to Updates section
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Post Project Update
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
      component: (
        <>
          <div className="mb-6">
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">Editing Restricted</h3>
                  <div className="mt-1 text-sm text-gray-700">
                    <p>Fundraising information cannot be modified for {projectStatus === 'FUNDRAISING_COMPLETED' ? 'a project in fundraising stage' : 'an approved project'}.</p>
                    {(projectStatus === 'FUNDRAISING_COMPLETED' &&
                      formData.fundraisingInfo?.phases?.length > 0 &&
                      formData.fundraisingInfo.phases[formData.fundraisingInfo.phases.length - 1]?.status === 'COMPLETED') && (
                        <p className="mt-1 font-medium text-blue-700">
                          However, you can request a time extension since your last phase is completed.
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`relative ${(!editRestrictions.fundraisingInfo || projectStatus === 'FUNDRAISING' || projectStatus === 'APPROVED' || projectStatus === 'COMPLETED') ? 'opacity-70' : ''}`}>
            <style>{`
              .fundraising-info-container .normal-elements {
                ${(!editRestrictions.fundraisingInfo || projectStatus === 'FUNDRAISING' || projectStatus === 'APPROVED' || projectStatus === 'COMPLETED') ? 'pointer-events: none;' : ''}
              }
              
              .fundraising-info-container .time-extension-form {
                pointer-events: auto !important;
                opacity: 1 !important;
              }
            `}</style>

            <div className="fundraising-info-container">
              <FundraisingInformation
                formData={{
                  projectId: formData.projectId,
                  startDate: formData.fundraisingInfo?.startDate || '',
                  phases: Array.isArray(formData.fundraisingInfo?.phases) ? formData.fundraisingInfo.phases : [],
                  totalTargetAmount: formData.basicInfo?.totalTargetAmount
                }}
                updateFormData={(data) => handleUpdateFormData('fundraisingInfo', data)}
                projectId={formData.projectId}
                isEditPage={true}
                isLastPhaseCompleted={
                  formData.fundraisingInfo?.phases?.length > 0 &&
                  formData.fundraisingInfo.phases[formData.fundraisingInfo.phases.length - 1]?.status === 'COMPLETED' &&
                  (projectStatus === 'FUNDRAISING_COMPLETED' || projectStatus === 'APPROVED')
                }
                showTimeExtensionRequest={
                  projectStatus === 'FUNDRAISING_COMPLETED' &&
                  formData.fundraisingInfo?.phases?.length > 0 &&
                  formData.fundraisingInfo.phases[formData.fundraisingInfo.phases.length - 1]?.status === 'COMPLETED'
                }
              />
            </div>
          </div>
        </>
      )
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
        readOnly={!editRestrictions.rewardInfo || projectStatus === 'FUNDRAISING' || projectStatus === 'APPROVED'}
        projectId={formData.projectId}
      />
    },
    {
      id: 'story',
      name: 'Project Story',
      component: <ProjectStoryHandler
        projectId={formData.projectId}
        initialStoryData={{
          ...formData.projectStory,
          // Ensure these fields exist with proper values
          id: formData.projectStory?.id || formData.projectStory?.projectStoryId,
          projectStoryId: formData.projectStory?.projectStoryId || formData.projectStory?.id,
          story: formData.projectStory?.story || '',
          risks: formData.projectStory?.risks || '',
          projectId: formData.projectId,
          status: formData.projectStory?.status || 'DRAFT',
          version: formData.projectStory?.version || 1,
          blocks: formData.projectStory?.blocks || []
        }}
        updateFormData={(data) => handleUpdateFormData('projectStory', data)}
        readOnly={!editRestrictions.projectStory}
        isEditMode={true}
        preserveAllBlockTypes={true}
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
        onCancel={() => { }}
        existingUpdates={existingUpdates}
        projectId={formData.projectId || formData.basicInfo?.projectId}
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
        <Header />
        <PageTitle title="Edit Project" />
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
                      disabled={isSaving || isUpdateBlogSection || userRole !== 'LEADER'}
                      className={`${isSaving || isUpdateBlogSection || userRole !== 'LEADER' ?
                        "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        } text-white font-semibold py-2 px-4 rounded-lg flex items-center relative`}
                      title={userRole !== 'LEADER' ? "Only team leaders can submit projects" : ""}
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
                      ) : projectStatus === 'DRAFT' ? (
                        "Save & Submit for Review"
                      ) : (
                        "Save Changes"
                      )}
                      {userRole !== 'LEADER' && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                          Only team leaders can submit
                        </span>
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
            {(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'FUNDRAISING', 'FUNDRAISING_COMPLETED'].includes(projectStatus)) && (
              <div className="mt-10">
                <ProjectEvaluationPoint projectId={formData.projectId} />
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