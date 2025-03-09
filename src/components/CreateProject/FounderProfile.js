import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Founder profile information component for project creation
 * @param {Object} props - Component props
 * @param {Object} props.formData - Initial form data
 * @param {Function} props.updateFormData - Function to update parent form state
 * @returns {JSX.Element} Founder profile form
 */
export default function FounderProfile({ formData, updateFormData }) {
  // Initialize form with safe defaults to prevent null/undefined errors
  const [form, setForm] = useState({
    bio: formData?.bio || '',
    experience: formData?.experience || '',
    socialLinks: {
      website: formData?.socialLinks?.website || '',
      linkedin: formData?.socialLinks?.linkedin || '',
      twitter: formData?.socialLinks?.twitter || '',
      ...formData?.socialLinks
    },
    team: Array.isArray(formData?.team) ? [...formData.team] : [],
    ...formData // Keep any additional fields
  });

  const [teamMember, setTeamMember] = useState({
    name: '',
    role: '',
    bio: ''
  });
  const [showForm, setShowForm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm({
        ...form,
        [parent]: {
          ...form[parent],
          [child]: value
        }
      });
    } else {
      setForm({
        ...form,
        [name]: value
      });
    }
  };

  const handleBlur = () => {
    updateFormData(form);
  };

  const handleTeamMemberChange = (e) => {
    const { name, value } = e.target;
    setTeamMember({
      ...teamMember,
      [name]: value
    });
  };

  const addTeamMember = (e) => {
    e.preventDefault();
    if (teamMember.name && teamMember.role) {
      const newTeam = [...form.team, { ...teamMember, id: Date.now().toString() }];
      setForm({
        ...form,
        team: newTeam
      });
      updateFormData({
        ...form,
        team: newTeam
      });
      setTeamMember({
        name: '',
        role: '',
        bio: ''
      });
      setShowForm(false);
    }
  };

  const removeTeamMember = (id) => {
    const newTeam = form.team.filter(member => member.id !== id);
    setForm({
      ...form,
      team: newTeam
    });
    updateFormData({
      ...form,
      team: newTeam
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Founder Profile</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Tell backers about yourself and your team. Projects with complete profiles inspire more trust.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Founder Bio *
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={form.bio}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Tell backers about yourself and why you're qualified to run this project"
          required
        />
      </div>

      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
          Relevant Experience *
        </label>
        <textarea
          id="experience"
          name="experience"
          rows={3}
          value={form.experience}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Describe your experience relevant to this project"
          required
        />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Social Links
        </label>
        
        <div>
          <label htmlFor="website" className="block text-sm text-gray-500">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="socialLinks.website"
            value={form.socialLinks.website}
            onChange={handleChange}
            onBlur={handleBlur}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="https://yourwebsite.com"
          />
        </div>
        
        <div>
          <label htmlFor="linkedin" className="block text-sm text-gray-500">
            LinkedIn
          </label>
          <input
            type="url"
            id="linkedin"
            name="socialLinks.linkedin"
            value={form.socialLinks.linkedin}
            onChange={handleChange}
            onBlur={handleBlur}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>
        
        <div>
          <label htmlFor="twitter" className="block text-sm text-gray-500">
            Twitter
          </label>
          <input
            type="url"
            id="twitter"
            name="socialLinks.twitter"
            value={form.socialLinks.twitter}
            onChange={handleChange}
            onBlur={handleBlur}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="https://twitter.com/yourhandle"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Members</h3>
        
        {form.team.length > 0 ? (
          <div className="space-y-4 mb-6">
            {form.team.map((member) => (
              <div key={member.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTeamMember(member.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Remove
                  </button>
                </div>
                {member.bio && (
                  <p className="mt-2 text-sm text-gray-600">{member.bio}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic mb-4">No team members added yet.</p>
        )}

        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Team Member
          </button>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-md font-medium text-gray-900 mb-4">Add Team Member</h4>
            <form onSubmit={addTeamMember} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={teamMember.name}
                  onChange={handleTeamMemberChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role *
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  required
                  value={teamMember.role}
                  onChange={handleTeamMemberChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g., CTO, Designer, Marketing Lead"
                />
              </div>
              
              <div>
                <label htmlFor="memberBio" className="block text-sm font-medium text-gray-700">
                  Bio (Optional)
                </label>
                <textarea
                  id="memberBio"
                  name="bio"
                  rows={3}
                  value={teamMember.bio}
                  onChange={handleTeamMemberChange}
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Brief description of their background and expertise"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Add prop type validation
FounderProfile.propTypes = {
  formData: PropTypes.object,
  updateFormData: PropTypes.func.isRequired
};

// Default props
FounderProfile.defaultProps = {
  formData: {
    bio: '',
    experience: '',
    socialLinks: {
      website: '',
      linkedin: '',
      twitter: ''
    },
    team: []
  }
};