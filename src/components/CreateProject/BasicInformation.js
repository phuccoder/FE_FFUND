import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Basic information form for project creation
 * @param {Object} props - Component props
 * @param {Object} props.formData - Initial form data
 * @param {Function} props.updateFormData - Function to update parent form state
 * @returns {JSX.Element} Basic information form
 */
export default function BasicInformation({ formData, updateFormData }) {
  // Initialize with safe default structure
  const [form, setForm] = useState({
    title: formData?.title || '',
    category: formData?.category || '',
    tags: Array.isArray(formData?.tags) ? [...formData.tags] : [],
    shortDescription: formData?.shortDescription || '',
    location: formData?.location || '',
    ...formData // Keep any additional fields
  });
  
  const [tagInput, setTagInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  const handleBlur = () => {
    updateFormData(form);
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      const newTags = [...form.tags, tagInput.trim()];
      setForm({
        ...form,
        tags: newTags
      });
      updateFormData({
        ...form,
        tags: newTags
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    const newTags = form.tags.filter(tag => tag !== tagToRemove);
    setForm({
      ...form,
      tags: newTags
    });
    updateFormData({
      ...form,
      tags: newTags
    });
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const categories = [
    'Technology', 'Design', 'Film & Video', 'Arts', 'Music', 'Food', 
    'Publishing', 'Games', 'Fashion', 'Education', 'Healthcare', 'Environment'
  ];

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Project Title *
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={form.title || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Give your project a clear, concise title"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Your title should clearly communicate what your project is about.
        </p>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Project Category *
        </label>
        <select
          id="category"
          name="category"
          value={form.category || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          required
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Project Tags
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            name="tagInput"
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
            placeholder="Add relevant tags (press Enter)"
          />
          <button
            type="button"
            onClick={addTag}
            className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
          >
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {form.tags && form.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1.5 h-4 w-4 text-blue-400 hover:text-blue-600"
              >
                <span className="sr-only">Remove tag {tag}</span>
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700">
          Short Description *
        </label>
        <textarea
          id="shortDescription"
          name="shortDescription"
          rows={3}
          value={form.shortDescription || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Describe your project in a few sentences"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          This will appear in search results and project listings. Max 160 characters.
        </p>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Project Location
        </label>
        <input
          type="text"
          name="location"
          id="location"
          value={form.location || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="City, Country"
        />
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Phased Projects</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Your project can have multiple development phases, each with its own duration, funding goals, and rewards. Configure your project&apos;s phases in the upcoming sections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add prop type validation
BasicInformation.propTypes = {
  formData: PropTypes.object,
  updateFormData: PropTypes.func.isRequired
};

// Default props
BasicInformation.defaultProps = {
  formData: {
    title: '',
    category: '',
    tags: [],
    shortDescription: '',
    location: ''
  }
};