import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import projectService from 'src/services/projectService';
import ImageUpload from './ImageUpload';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { authenticate } from 'src/services/authenticate';
import { tokenManager } from '@/utils/tokenManager';

/**
 * Basic information form for project creation
 * @param {Object} props - Component props
 * @param {Object} props.formData - Initial form data
 * @param {Function} props.updateFormData - Function to update parent form state
 * @param {boolean} props.editMode - Whether we're editing an existing project
 * @returns {JSX.Element} Basic information form
 */
export default function BasicInformation({ formData, updateFormData, editMode }) {
  // Initialize with safe default structure
  const [form, setForm] = useState({
    title: formData?.title || '',
    categoryId: formData?.id || formData?.category || '',
    subCategoryIds: Array.isArray(formData?.id)
      ? [...formData.id]
      : (formData?.subCategory ? [formData.subCategory] : []),
    shortDescription: formData?.shortDescription || formData?.projectDescription || 'Brief description of the project',
    location: formData?.location || formData?.projectLocation || '',
    projectUrl: formData?.projectUrl || '',
    mainSocialMediaUrl: formData?.mainSocialMediaUrl || '',
    projectVideoDemo: formData?.projectVideoDemo || '',
    isClassPotential: formData?.isClassPotential !== undefined ? formData.isClassPotential : false,
    projectId: formData?.projectId || null,
    totalTargetAmount: formData?.totalTargetAmount || 1000,
    status: formData?.status || 'DRAFT',
    ...formData
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [projectImage, setProjectImage] = useState(formData?.projectImage || null);
  const [loading, setLoading] = useState({
    categories: false,
    subcategories: false,
    submit: false,
    fetchingProject: false
  });
  const [error, setError] = useState({
    categories: null,
    subcategories: null,
    submit: null,
    fetchingProject: null,
    validation: {}
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [phaseRules, setPhaseRules] = useState([]);
  const [showPhaseRules, setShowPhaseRules] = useState(false);
  const [platformFee, setPlatformFee] = useState(null);
  const [isLoadingFee, setIsLoadingFee] = useState(false);

  // Load existing project data if we're in edit mode
  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchPhaseRules();

    if (editMode) {
      fetchFounderProject();
    }
  }, [editMode]);

  // Filter subcategories when category changes
  useEffect(() => {
    if (form.categoryId) {
      const selectedCategory = categories.find(cat => cat.id === parseInt(form.categoryId));
      if (selectedCategory && selectedCategory.subCategories) {
        setFilteredSubcategories(selectedCategory.subCategories);

        // Clear selected subcategory IDs that are not in the new category
        const validSubcategoryIds = selectedCategory.subCategories.map(sub => sub.id);
        const updatedSubcategoryIds = form.subCategoryIds.filter(id =>
          validSubcategoryIds.includes(parseInt(id))
        );

        if (updatedSubcategoryIds.length !== form.subCategoryIds.length) {
          setForm(prev => ({
            ...prev,
            subCategoryIds: updatedSubcategoryIds
          }));
          updateFormData({
            ...form,
            subCategoryIds: updatedSubcategoryIds
          });
        }
      } else {
        setFilteredSubcategories([]);
      }
    } else {
      setFilteredSubcategories([]);
    }
  }, [form.categoryId, categories]);

  useEffect(() => {
    if (formData?.projectImage && formData.projectImage !== projectImage) {
      console.log('Updating projectImage from formData:', formData.projectImage);
      setProjectImage(formData.projectImage);
    }
  }, [formData]);

  // Fetch founder's existing project
  const fetchFounderProject = async () => {
    setLoading(prev => ({ ...prev, fetchingProject: true }));
    setError(prev => ({ ...prev, fetchingProject: null }));

    try {
      const response = await projectService.getCurrentProjectByFounder();
      console.log('Raw API response from getProjectsByFounder:', response);

      // Handle different response formats
      let projects = [];
      if (response && response.data && Array.isArray(response.data)) {
        projects = response.data;
      } else if (response && Array.isArray(response)) {
        projects = response;
      } else if (response && response.data) {
        projects = [response.data];
      } else if (response) {
        projects = [response];
      }

      // If founder has at least one project, load the first one
      if (projects && projects.length > 0) {
        const project = projects[0]; // Assuming we're working with the first project
        console.log('Selected project raw data:', project);
        console.log('Project Image URL from API:', project.projectImage);

        const projectId = project.id || project.projectId || project._id || project.idProject || null;
        console.log('Extracted projectId:', projectId);

        // Map API response to form fields
        const projectData = {
          projectId: project.id || project.projectId,
          id: projectId,
          title: project.title || '',
          shortDescription: project.description || project.projectDescription || project.shortDescription || 'Brief description of the project',
          location: project.location || project.projectLocation || '',
          projectLocation: project.location || project.projectLocation || '',
          isClassPotential: project.isClassPotential || false,
          projectUrl: project.projectUrl || '',
          mainSocialMediaUrl: project.mainSocialMediaUrl || '',
          projectVideoDemo: project.projectVideoDemo || '',
          categoryId: project.category?.id?.toString() || '',
          subCategoryIds: project.subCategories?.map(sub => sub.id) || [],
          totalTargetAmount: project.totalTargetAmount || 1000,
          status: project.status || 'DRAFT',
          projectImage: project.projectImage || null
        };

        console.log('Transformed project data with image URL:', projectData);

        // Update form state
        setForm(projectData);

        // Update projectImage state explicitly
        console.log('Setting projectImage state to:', project.projectImage);
        setProjectImage(project.projectImage);

        // Update parent state
        updateFormData({
          ...projectData,
          projectImage: project.projectImage,
          projectId: projectId,
        });
      }
    } catch (err) {
      console.error('Error fetching founder project:', err);
      setError(prev => ({
        ...prev,
        fetchingProject: 'Failed to load existing project. Please try again later.'
      }));
    } finally {
      setLoading(prev => ({ ...prev, fetchingProject: false }));
    }
  };

  const fetchCategories = async () => {
    setLoading(prev => ({ ...prev, categories: true }));
    setError(prev => ({ ...prev, categories: null }));

    try {
      const data = await projectService.getAllCategories();

      // Map the API response to the expected format
      const mappedCategories = data.map(category => ({
        id: category.id,
        categoryName: category.name || category.categoryName,
        description: category.description,
        subCategories: (category.subCategories || []).map(sub => ({
          id: sub.id,
          subCategoryName: sub.name || sub.subCategoryName,
          subCategoryDescription: sub.description || sub.subCategoryDescription
        }))
      }));

      console.log("Mapped categories:", mappedCategories);
      setCategories(mappedCategories);

      // If we have a selected category, filter subcategories immediately
      if (form.categoryId) {
        const selectedCategory = mappedCategories.find(cat => cat.id === parseInt(form.categoryId));
        if (selectedCategory && selectedCategory.subCategories) {
          setFilteredSubcategories(selectedCategory.subCategories);
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(prev => ({
        ...prev,
        categories: 'Failed to load categories. Please try again later.'
      }));
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const fetchSubcategories = async () => {
    setLoading(prev => ({ ...prev, subcategories: true }));
    setError(prev => ({ ...prev, subcategories: null }));

    try {
      const data = await projectService.getAllSubcategories();

      // Map the API response to the expected format
      const mappedSubcategories = data.map(sub => ({
        id: sub.id,
        subCategoryName: sub.name || sub.subCategoryName,
        subCategoryDescription: sub.description || sub.subCategoryDescription,
        categoryId: sub.categoryId
      }));

      console.log("Mapped subcategories:", mappedSubcategories);
      setSubcategories(mappedSubcategories);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      setError(prev => ({
        ...prev,
        subcategories: 'Failed to load subcategories. Please try again later.'
      }));
    } finally {
      setLoading(prev => ({ ...prev, subcategories: false }));
    }
  };

  const fetchPhaseRules = async () => {
    setLoading(prev => ({ ...prev, phaseRules: true }));
    setError(prev => ({ ...prev, phaseRules: null }));

    try {
      const data = await projectService.getAllPhaseRules();

      // Sort phase rules by minTotal in ascending order
      const sortedRules = Array.isArray(data)
        ? [...data].sort((a, b) => a.minTotal - b.minTotal)
        : [];

      console.log("Fetched phase rules:", sortedRules);
      setPhaseRules(sortedRules);
    } catch (err) {
      console.error("Error fetching phase rules:", err);
      setError(prev => ({
        ...prev,
        phaseRules: 'Failed to load phase rules. Please try again later.'
      }));
    } finally {
      setLoading(prev => ({ ...prev, phaseRules: false }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear validation error for this field when it changes
    setError(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        [name]: null
      }
    }));

    // Handle numeric value for totalTargetAmount
    if (name === 'totalTargetAmount') {
      const numericValue = parseFloat(value) || 0;
      setForm({
        ...form,
        [name]: numericValue
      });
    } else {
      setForm({
        ...form,
        [name]: value
      });
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setForm({
      ...form,
      [name]: checked
    });
  };

  const handleSubcategoryChange = (subcategoryId) => {
    const id = parseInt(subcategoryId);
    const isSelected = form.subCategoryIds.includes(id);

    let updatedSubcategoryIds;
    if (isSelected) {
      updatedSubcategoryIds = form.subCategoryIds.filter(subId => subId !== id);
    } else {
      updatedSubcategoryIds = [...form.subCategoryIds, id];
    }

    setForm({
      ...form,
      subCategoryIds: updatedSubcategoryIds
    });

    updateFormData({
      ...form,
      subCategoryIds: updatedSubcategoryIds
    });
  };

  const handleBlur = () => {
    updateFormData({
      ...form,
      projectLocation: form.location, // Ensure both field names are updated
      location: form.location
    });
  };

  // Validate the form before submission
  const validateForm = () => {
    const validationErrors = {};

    // Only validate required fields
    if (!form.title?.trim()) {
      validationErrors.title = 'Project title is required';
    }

    if (!form.shortDescription?.trim()) {
      validationErrors.shortDescription = 'Project description is required';
    }

    if (!form.categoryId) {
      validationErrors.categoryId = 'Please select a category';
    }

    if (!form.subCategoryIds?.length) {
      validationErrors.subCategoryIds = 'Please select at least one subcategory';
    }

    if (!form.totalTargetAmount || form.totalTargetAmount < 1000) {
      validationErrors.totalTargetAmount = 'Target amount must be at least 1000$';
    }


    return {
      isValid: Object.keys(validationErrors).length === 0,
      errors: validationErrors
    };
  };

  const handleImageUpdate = (imageResult) => {
    console.log('Project image updated:', imageResult);

    if (imageResult === null) {
      console.log('Removing project image');

      setProjectImage(null);

      const updatedForm = {
        ...form,
        projectImage: null,
        projectImageFile: null
      };

      setForm(updatedForm);

      updateFormData(updatedForm);

      console.log('Project image removed from form:', updatedForm);
      return;
    }

    // Handle different possible formats of the image result
    if (typeof imageResult === 'string') {
      // Direct URL was provided
      console.log('Setting project image from URL:', imageResult);

      setProjectImage(imageResult);

      const updatedForm = {
        ...form,
        projectImage: imageResult,
        projectImageFile: null // Clear any previous file since we now have a URL
      };

      setForm(updatedForm);
      updateFormData(updatedForm);

    } else if (imageResult && imageResult.tempUrl) {
      // Temporary URL with pending server update
      console.log('Setting temporary image URL:', imageResult.tempUrl);

      setProjectImage(imageResult.tempUrl);

      const updatedForm = {
        ...form,
        projectImage: imageResult.tempUrl,
        pendingImageUpdate: true
      };

      setForm(updatedForm);
      updateFormData(updatedForm);

    } else if (imageResult && (imageResult.isLocalPreview || imageResult.file)) {
      // File object was provided (either directly or with isLocalPreview flag)
      const file = imageResult.file || imageResult;
      const previewUrl = imageResult.previewUrl || URL.createObjectURL(file);

      console.log('Setting project image from file:', file.name);
      console.log('Preview URL:', previewUrl);

      setProjectImage(previewUrl);

      const updatedForm = {
        ...form,
        projectImage: previewUrl,
        projectImageFile: file
      };

      setForm(updatedForm);
      updateFormData(updatedForm);
    } else {
      console.error('Unexpected image result format:', imageResult);
    }
  };

  const getApplicablePhaseRule = () => {
    if (!phaseRules || phaseRules.length === 0) return null;

    const targetAmount = parseFloat(form.totalTargetAmount || 0);

    // Find the highest rule that the target amount meets or exceeds
    let applicableRule = null;

    for (const rule of phaseRules) {
      if (targetAmount >= rule.minTotal) {
        if (!applicableRule || rule.minTotal > applicableRule.minTotal) {
          applicableRule = rule;
        }
      }
    }

    return applicableRule;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form with data:", form);

    const { isValid, errors } = validateForm();

    if (!isValid) {
      setError(prev => ({
        ...prev,
        validation: errors,
        submit: 'Please correct the errors below before submitting.'
      }));
      return;
    }

    setLoading(prev => ({ ...prev, submit: true }));
    setError(prev => ({ ...prev, submit: null, validation: {} }));
    setSubmitSuccess(false);

    try {
      // Create API payload WITHOUT location/campus field
      const apiPayload = {
        title: form.title || '',
        projectDescription: form.shortDescription || 'Brief description of the project',
        // Removed projectLocation/location field
        status: form.status || 'DRAFT',
        projectVideoDemo: form.projectVideoDemo || '',
        projectUrl: form.projectUrl || '',
        mainSocialMediaUrl: form.mainSocialMediaUrl || '',
        totalTargetAmount: parseFloat(form.totalTargetAmount) || 1000,
        categoryId: parseInt(form.categoryId) || 0,
        subCategoryIds: form.subCategoryIds.map(id => parseInt(id))
      };

      console.log("API payload with projectDescription:", apiPayload.projectDescription);
      console.log("Complete API payload:", apiPayload);

      let result;

      if (form.projectId) {
        result = await projectService.updateProjectInfo(form.projectId, apiPayload);
      } else {
        result = await projectService.createProject(apiPayload);
      }

      console.log("API result:", result);
      const projectId = result?.projectId || result?.id || result?.data?.projectId || result?.data?.id;
      console.log("Extracted projectId:", projectId);

      if (projectId) {
        const updatedForm = {
          ...form,
          projectId: projectId,
          title: result.title || form.title,
          shortDescription: result.projectDescription || form.shortDescription,
          isClassPotential: form.isClassPotential
        };

        console.log("Updated form with projectId:", updatedForm);
        setForm(updatedForm);

        if (projectId && form.projectImageFile && !form.projectImage.startsWith('http')) {
          try {
            console.log('Uploading project image after project creation');
            const uploadResult = await projectService.uploadProjectImage(projectId, form.projectImageFile);
            console.log('Image upload result after project creation:', uploadResult);

          } catch (imageError) {
            console.error('Error uploading project image after project creation:', imageError);
          }
        }

        updateFormData({
          ...updatedForm,
          projectId: projectId,
          shortDescription: updatedForm.shortDescription,
          projectDescription: updatedForm.shortDescription, // Add this explicitly for other components
          totalTargetAmount: parseFloat(updatedForm.totalTargetAmount) || 1000,
          status: updatedForm.status || 'DRAFT',
          isClassPotential: form.isClassPotential
        });

        // AFTER successful project creation/update, refresh token to update teamRole
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            console.log("Refreshing token after successful project creation/update");
            const refreshResponse = await authenticate.refreshToken(refreshToken);
            if (refreshResponse && refreshResponse.data) {
              const { accessToken, refreshToken: newRefreshToken, teamRole } = refreshResponse.data;
              tokenManager.setTokens(accessToken, newRefreshToken);
              if (teamRole) {
                localStorage.setItem('teamRole', teamRole);
                console.log("Updated teamRole after project creation:", teamRole);
              }
            }
          } catch (refreshError) {
            console.error("Error refreshing token after project creation:", refreshError);
          }
        }
      }

      setSubmitSuccess(true);
    } catch (error) {
      console.error("Project creation/update error:", error);

      if (error.response?.data?.error) {
        const serverErrors = error.response.data.error;
        setError(prev => ({
          ...prev,
          validation: serverErrors,
          submit: 'The server reported validation errors. Please correct them and try again.'
        }));
      } else {
        setError(prev => ({
          ...prev,
          submit: error.message || `Failed to ${form.projectId ? 'update' : 'create'} project. Please try again later.`
        }));
      }
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const fetchPlatformFee = useCallback(async () => {
    try {
      setIsLoadingFee(true);
      const feeData = await projectService.getPlatformValuePercentage();
      if (feeData && feeData.data && feeData.data.value) {
        setPlatformFee(feeData.data.value);
      } else {
        setPlatformFee(0.02);
      }
    } catch (error) {
      console.error('Error fetching platform fee:', error);
      setPlatformFee(0.02);
    } finally {
      setIsLoadingFee(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatformFee();
  }, [fetchPlatformFee]);

  const calculateFees = (amount) => {
    const amount_num = parseFloat(amount || 0);
    if (isNaN(amount_num) || amount_num <= 0) return { platformFee: 0, stripeFee: 0, total: 0 };

    const platformFeeAmount = amount_num * (platformFee || 0.02);
    const stripeFeeAmount = (amount_num * 0.029) + 0.3;
    const totalFees = platformFeeAmount + stripeFeeAmount;

    return {
      platformFee: platformFeeAmount,
      stripeFee: stripeFeeAmount,
      total: totalFees
    };
  };



  const statusOptions = [
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'FUNDRAISING_COMPLETED', 'CANCELLED', 'SUSPENDED'
  ];

  return (
    <>
      <ToastContainer />
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Error messages */}
        {(error.categories || error.subcategories || error.submit || error.fetchingProject) && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Errors</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {error.categories && <li>{error.categories}</li>}
                    {error.subcategories && <li>{error.subcategories}</li>}
                    {error.submit && <li>{error.submit}</li>}
                    {error.fetchingProject && <li>{error.fetchingProject}</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading message for existing project */}
        {loading.fetchingProject && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">Loading your project information...</p>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        {submitSuccess && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your project has been successfully {form.projectId ? 'updated' : 'created'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rest of the form fields remain the same */}
        <div>
          <label htmlFor="title" className="block text-xl font-medium text-gray-700">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={form.title || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mt-1 block w-full border ${error.validation.title ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="Give your project a clear, concise title"
            required
          />
          {error.validation.title ? (
            <p className="mt-1 text-sm text-red-600">{error.validation.title}</p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              Your title should clearly communicate what your project is about.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-lg font-medium text-gray-700">
            Project Category<span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={form.categoryId || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base ${error.validation.categoryId ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
            required
            disabled={loading.categories}
          >
            <option value="">Select a category</option>
            {categories.length > 0 ? (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.categoryName || category.name || `Category ${category.id}`}
                </option>
              ))
            ) : (
              <option value="" disabled>No categories available</option>
            )}
          </select>
          {error.validation.categoryId ? (
            <p className="mt-1 text-sm text-red-600">{error.validation.categoryId}</p>
          ) : loading.categories ? (
            <p className="mt-1 text-sm text-gray-500">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="mt-1 text-sm text-red-600">No categories available. Please check API response.</p>
          ) : null}
          <p className="mt-1 text-sm text-gray-500">
            {categories.length} categories loaded.
          </p>
        </div>

        {form.categoryId && (
          <div>
            <label className="block text-base font-medium text-gray-700">
              Subcategories
            </label>
            <div className={`mt-2 space-y-2 ${error.validation.subCategoryIds ? 'border border-red-300 p-3 rounded-md' : ''}`}>
              {loading.subcategories ? (
                <p className="text-sm text-gray-500">Loading subcategories...</p>
              ) : filteredSubcategories.length === 0 ? (
                <p className="text-sm text-gray-500">No subcategories available for this category.</p>
              ) : (
                filteredSubcategories.map((subcat) => (
                  <div key={subcat.id} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={`subcat-${subcat.id}`}
                        name={`subcat-${subcat.id}`}
                        type="checkbox"
                        checked={form.subCategoryIds.includes(subcat.id)}
                        onChange={() => handleSubcategoryChange(subcat.id)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={`subcat-${subcat.id}`} className="font-medium text-gray-700">
                        {subcat.subCategoryName || subcat.name || `Subcategory ${subcat.id}`}
                      </label>
                      {(subcat.subCategoryDescription || subcat.description) && (
                        <p className="text-gray-500">{subcat.subCategoryDescription || subcat.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {error.validation.subCategoryIds && (
              <p className="mt-1 text-sm text-red-600">{error.validation.subCategoryIds}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {filteredSubcategories.length} subcategories available for this category.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="shortDescription" className="block text-lg font-medium text-gray-700">
            Short Description<span className="text-red-500">*</span>
          </label>
          <textarea
            id="shortDescription"
            name="shortDescription"
            rows={3}
            value={form.shortDescription || ''}
            onChange={(e) => {
              // Limit the input to 300 characters
              if (e.target.value.length <= 300) {
                handleChange(e);
              }
            }}
            onBlur={handleBlur}
            className={`mt-1 block w-full border ${error.validation.shortDescription ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="Describe your project in a few sentences"
            maxLength={300}
            required
          />
          {error.validation.shortDescription ? (
            <p className="mt-1 text-sm text-red-600">{error.validation.shortDescription}</p>
          ) : (
            <div className="mt-1 flex justify-between">
              <p className="text-sm text-gray-500">
                This will appear in search results and project listings.
              </p>
              <span className={`text-sm ${form.shortDescription?.length > 250 ? 'text-orange-500' : 'text-gray-500'}`}>
                {form.shortDescription?.length || 0}/300
              </span>
            </div>
          )}
        </div>

        {editMode ? (
          <div>
            <label htmlFor="location" className="block text-lg font-medium text-gray-700">
              Location
            </label>
            <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700">
              {form.location || "Not specified"}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Project location cannot be edited once created.
            </p>
          </div>
        ) : null}

        <div>
          <label htmlFor="totalTargetAmount" className="block text-lg font-medium text-gray-700">
            Total Target Amount<span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="totalTargetAmount"
              id="totalTargetAmount"
              min="1000"
              value={form.totalTargetAmount || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1 block w-full border ${error.validation.totalTargetAmount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              placeholder="1000"
              required
            />
          </div>
          {error.validation.totalTargetAmount ? (
            <p className="mt-1 text-sm text-red-600">{error.validation.totalTargetAmount}</p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              The total amount you aim to raise for your project. Minimum 1000$.
            </p>
          )}
          {form.totalTargetAmount > 0 && (
            <div className="mt-3 bg-blue-50 rounded-md p-3 border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Platform & Processing Fees</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>FFUND Platform Fee ({(platformFee * 100).toFixed(1)}%):</span>
                  <span className="font-medium">${(form.totalTargetAmount * platformFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Processing (Stripe 2.9% + 30¢):</span>
                  <span className="font-medium">${((form.totalTargetAmount * 0.029) + 0.3).toFixed(2)}</span>
                </div>
                <div className="border-t border-blue-200 pt-1 mt-1 flex justify-between font-medium">
                  <span>Total Fees:</span>
                  <span>${calculateFees(form.totalTargetAmount).total.toFixed(2)}</span>
                </div>

                {/* Phần hiển thị số tiền thực nhận */}
                <div className="mt-3 bg-white p-2 rounded-md border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-700">Your Net Amount:</span>
                    <span className="font-bold text-xl text-green-700">
                      ${(form.totalTargetAmount - calculateFees(form.totalTargetAmount).total).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This is the estimated amount you&apos;ll received after deducting all platform fees and processing fees when your project finishes the entire fundraising process
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New Phase Rules Table */}
        <div className="mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-medium text-gray-700">Funding Phase Requirements</h3>
            <button
              type="button"
              onClick={() => setShowPhaseRules(!showPhaseRules)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              {showPhaseRules ? 'Hide Details' : 'Show Details'}
              <svg
                className={`ml-1 h-4 w-4 transition-transform ${showPhaseRules ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {error.phaseRules && (
            <div className="mt-2 text-sm text-red-600">
              {error.phaseRules}
            </div>
          )}

          {loading.phaseRules ? (
            <div className="mt-4 flex justify-center">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-sm text-gray-500">Loading phase requirements...</span>
            </div>
          ) : (
            <>
              {/* Current applicable rule highlight */}
              {!editMode && (
                <div className="mt-2 bg-blue-50 p-3 rounded-md border border-blue-100">
                  {getApplicablePhaseRule() ? (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        For your target amount of {formatCurrency(form.totalTargetAmount)}, you&apos;ll need to create at least
                        <span className="font-bold text-blue-800 mx-1">
                          {getApplicablePhaseRule().totalPhaseCount} funding {getApplicablePhaseRule().totalPhaseCount === 1 ? 'phase' : 'phases'}
                        </span>
                        in the Fundraising Information section.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Please enter a valid target amount to see phase requirements.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsible rules table */}
              {showPhaseRules && phaseRules.length > 0 && (
                <div className="mt-3 border border-gray-200 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Required Phases
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {phaseRules.map((rule) => {
                        const isApplicable = parseFloat(form.totalTargetAmount || 0) >= rule.minTotal;
                        const isCurrentRule = getApplicablePhaseRule()?.id === rule.id;

                        return (
                          <tr
                            key={rule.id}
                            className={`${isCurrentRule ? 'bg-blue-50' : ''} ${isApplicable ? '' : 'text-gray-400'}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {isCurrentRule && (
                                <span className="inline-flex items-center mr-2">
                                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </span>
                              )}
                              {formatCurrency(rule.minTotal)}+
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {rule.totalPhaseCount} {rule.totalPhaseCount === 1 ? 'phase' : 'phases'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {isApplicable ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Applicable
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Not Applicable
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <label htmlFor="projectUrl" className="block text-lg font-medium text-gray-700">
            Project Website URL (Optional)
          </label>
          <input
            type="url"
            name="projectUrl"
            id="projectUrl"
            value={form.projectUrl || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="https://www.example.com"
          />
          <p className="mt-1 text-sm text-gray-500">
            If your project has a dedicated website, add it here.
          </p>
        </div>

        <div>
          <label htmlFor="mainSocialMediaUrl" className="block text-lg font-medium text-gray-700">
            Main Social Media URL (Optional)
          </label>
          <input
            type="url"
            name="mainSocialMediaUrl"
            id="mainSocialMediaUrl"
            value={form.mainSocialMediaUrl || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="https://www.instagram.com/yourproject/"
          />
          <p className="mt-1 text-sm text-gray-500">
            Add your most active social media account for the project.
          </p>
        </div>

        <div>
          <label htmlFor="projectVideoDemo" className="block text-lg font-medium text-gray-700">
            Project Describes Video (Optional)
          </label>
          <input
            type="url"
            name="projectVideoDemo"
            id="projectVideoDemo"
            value={form.projectVideoDemo || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="https://www.youtube.com/watch?v=example"
          />
          <p className="mt-1 text-sm text-gray-500">
            Add a YouTube or Vimeo link to a video about your project.
          </p>
        </div>

        {editMode ? (
          <div className="relative flex items-start bg-gray-50 p-4 rounded-md">
            <div className="flex items-center h-5">
              <input
                id="isClassPotential"
                name="isClassPotential"
                type="checkbox"
                checked={form.isClassPotential || false}
                disabled={true}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-not-allowed opacity-70"
              />
            </div>
            <div className="ml-3 text-lg">
              <label htmlFor="isClassPotential" className="font-medium text-gray-700">
                Class Potential Project
              </label>
              <p className="text-gray-500 italic">
                This indicates whether this project has been flagged as a class potential project.
                This setting can only be modified by administrators.
              </p>
            </div>
          </div>
        ) : null}

        <ImageUpload
          projectId={form.projectId}
          currentImage={projectImage}
          onImageUpdate={handleImageUpdate}
        />

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading.submit}
              className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading.submit ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading.submit ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {form.projectId ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                form.projectId ? 'Update Project' : 'Create Project'
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

BasicInformation.propTypes = {
  formData: PropTypes.object,
  updateFormData: PropTypes.func.isRequired,
  editMode: PropTypes.bool
};

BasicInformation.defaultProps = {
  formData: {},
  editMode: false
};