import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Link from '../Reuseable/Link'; 
import { getUserExtendedInfo } from '../../services/userService';
import { getTeamById } from '../../services/teamService';

/**
 * Founder profile information component for project creation
 * Displays founder and team info from the API in a read-only format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Initial form data (for compatibility with parent component)
 * @param {Function} props.updateFormData - Function to update parent form state
 * @param {number|string} props.projectId - Project ID to fetch team data (if available)
 * @returns {JSX.Element} Founder profile display
 */
function FounderProfile({ formData, updateFormData, projectId }) {
  const [userInfo, setUserInfo] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataProcessed, setDataProcessed] = useState(false);

  // Fetch user extended info and team information
  useEffect(() => {
    // Prevent re-fetching if we've already processed data
    if (dataProcessed) return;
    
    const fetchUserAndTeamData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get user extended information
        const response = await getUserExtendedInfo();
        console.log('API Response:', response);
        
        // The response could be in different formats, handle both possibilities
        const extendedUserData = response.data || response;
        console.log('Extended user data processed:', extendedUserData);
        
        // Check if the response is directly what we expect
        if (extendedUserData && extendedUserData.user) {
          setUserInfo(extendedUserData);
          processUserAndTeamData(extendedUserData, extendedUserData.teamId);
        } 
        // Check if the response is nested under data
        else if (extendedUserData && extendedUserData.data && extendedUserData.data.user) {
          setUserInfo(extendedUserData.data);
          processUserAndTeamData(extendedUserData.data, extendedUserData.data.teamId);
        } 
        else {
          console.error('Unexpected API response structure:', extendedUserData);
          setError('Unable to retrieve user information. Please try again later.');
          
          // Provide empty data to prevent further errors
          updateFormData({
            bio: '',
            fullName: '',
            email: '',
            avatar: '',
            phone: '',
            identifyNumber: '',
            ffundLink: '',
            studentInfo: {
              studentCode: '',
              studentClass: '',
              exeClass: '',
              fptFacility: '',
              portfolio: '',
            },
            team: []
          });
        }
        
      } catch (err) {
        console.error('Error fetching user or team data:', err);
        setError('Failed to load user information. Please try again later.');
        
        // Provide empty data to prevent further errors
        updateFormData({
          bio: '',
          fullName: '',
          email: '',
          avatar: '',
          phone: '',
          identifyNumber: '',
          ffundLink: '',
          studentInfo: {
            studentCode: '',
            studentClass: '',
            exeClass: '',
            fptFacility: '',
            portfolio: '',
          },
          team: []
        });
      } finally {
        setLoading(false);
        setDataProcessed(true);
      }
    };
    
    fetchUserAndTeamData();
  }, [dataProcessed, updateFormData]);
  
  // Separate function to process user data and fetch team data
  const processUserAndTeamData = async (userData, teamId) => {
    // Handle team data if teamId exists
    if (teamId) {
      try {
        const teamResponse = await getTeamById(teamId);
        console.log('Team Response:', teamResponse);
        
        // Handle different response structures
        const teamData = teamResponse.data || teamResponse;
        
        if (teamData) {
          setTeamInfo(teamData);
          
          // Update parent component form data with user and team information
          const updatedForm = {
            bio: userData.user?.userInformation || '',
            fullName: userData.user?.fullName || '',
            email: userData.user?.email || '',
            avatar: userData.user?.userAvatar || '',
            phone: userData.user?.telephoneNumber || '',
            identifyNumber: userData.user?.identifyNumber || '',
            ffundLink: userData.user?.userFfundLink || '',
            studentInfo: {
              studentCode: userData.studentCode || '',
              studentClass: userData.studentClass || '',
              exeClass: userData.exeClass || '',
              fptFacility: userData.fptFacility || '',
              portfolio: userData.studentPortfolio || '',
            },
            teamId: teamId,
            teamName: teamData.teamName || '',
            teamDescription: teamData.teamDescription || '',
            // Map team members to the expected format
            team: teamData.teamMembers ? teamData.teamMembers.map(member => ({
              id: member.memberId?.toString() || `member-${Math.random().toString(36).substring(2, 11)}`,
              userId: member.userId || '',
              name: member.memberName || '',
              role: member.teamRole || '',
              email: member.memberEmail || '',
              avatar: member.memberAvatar || ''
            })) : []
          };
          
          // Update parent component ONCE
          updateFormData(updatedForm);
        }
      } catch (teamErr) {
        console.error('Error fetching team data:', teamErr);
        // Don't set an error state here, just continue with user data
        
        // Update with just user data
        const userOnlyData = {
          bio: userData.user?.userInformation || '',
          fullName: userData.user?.fullName || '',
          email: userData.user?.email || '',
          avatar: userData.user?.userAvatar || '',
          phone: userData.user?.telephoneNumber || '',
          identifyNumber: userData.user?.identifyNumber || '',
          ffundLink: userData.user?.userFfundLink || '',
          studentInfo: {
            studentCode: userData.studentCode || '',
            studentClass: userData.studentClass || '',
            exeClass: userData.exeClass || '',
            fptFacility: userData.fptFacility || '',
            portfolio: userData.studentPortfolio || '',
          },
          teamId: teamId,
          team: []
        };
        updateFormData(userOnlyData);
      }
    } else {
      // No team found, just update with user data
      const userOnlyData = {
        bio: userData.user?.userInformation || '',
        fullName: userData.user?.fullName || '',
        email: userData.user?.email || '',
        avatar: userData.user?.userAvatar || '',
        phone: userData.user?.telephoneNumber || '',
        identifyNumber: userData.user?.identifyNumber || '',
        ffundLink: userData.user?.userFfundLink || '',
        studentInfo: {
          studentCode: userData.studentCode || '',
          studentClass: userData.studentClass || '',
          exeClass: userData.exeClass || '',
          fptFacility: userData.fptFacility || '',
          portfolio: userData.studentPortfolio || '',
        },
        team: []
      };
      updateFormData(userOnlyData);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">Loading your information...</p>
            </div>
          </div>
        </div>
      )}

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
                The information below is pulled from your user profile. To update your personal details or team information, 
                please visit your <Link href="/profile" className="text-blue-800 underline hover:no-underline">profile page</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Founder Details Card */}
      {userInfo && userInfo.user && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              {userInfo.user.userAvatar && (
                <img 
                  src={userInfo.user.userAvatar} 
                  alt={userInfo.user.fullName || 'User'} 
                  className="h-20 w-20 rounded-full object-cover mr-4"
                />
              )}
              <div>
                <h3 className="text-xl font-medium text-gray-900">{userInfo.user.fullName || 'User'}</h3>
                <p className="text-sm text-gray-500">
                  {userInfo.user.roles === "FOUNDER" ? "Project Founder" : userInfo.user.roles || 'User'}
                </p>
                <p className="text-sm text-gray-600 mt-1">{userInfo.user.email || 'No email provided'}</p>
                {userInfo.user.telephoneNumber && (
                  <p className="text-sm text-gray-600">{userInfo.user.telephoneNumber}</p>
                )}
              </div>
            </div>
            
            {/* Biography section */}
            {userInfo.user.userInformation && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
                <p className="text-sm text-gray-700">{userInfo.user.userInformation}</p>
              </div>
            )}
            
            {/* FFund Profile Link */}
            {userInfo.user.userFfundLink && (
              <div className="mt-3">
                <a 
                  href={userInfo.user.userFfundLink}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  FFund Profile
                </a>
              </div>
            )}
            
            {/* Student Information */}
            {userInfo.studentCode && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Student Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Student Code</p>
                    <p className="text-sm text-gray-900">{userInfo.studentCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Class</p>
                    <p className="text-sm text-gray-900">{userInfo.studentClass || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">EXE Class</p>
                    <p className="text-sm text-gray-900">{userInfo.exeClass || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">FPT Facility</p>
                    <p className="text-sm text-gray-900">{userInfo.fptFacility || "N/A"}</p>
                  </div>
                </div>
                {userInfo.studentPortfolio && (
                  <div className="mt-3">
                    <a 
                      href={userInfo.studentPortfolio}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Portfolio
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Display Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Team Information</h3>
          {userInfo && userInfo.teamId && (
            <span className="text-sm text-gray-500">Team ID: {userInfo.teamId}</span>
          )}
        </div>

        {teamInfo && teamInfo.teamName && (
          <div className="mb-4 bg-white p-4 rounded-md border border-gray-200">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700">Team Name</h4>
              <p className="text-base text-gray-900">{teamInfo.teamName}</p>
            </div>
            
            {teamInfo.teamDescription && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700">Description</h4>
                <p className="text-sm text-gray-700">{teamInfo.teamDescription}</p>
              </div>
            )}
            
            {teamInfo.projectId && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Project ID</h4>
                <p className="text-sm text-gray-900">#{teamInfo.projectId}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Team Members List */}
        <h4 className="text-md font-medium text-gray-800 mb-3">Team Members</h4>
        {teamInfo && teamInfo.teamMembers && teamInfo.teamMembers.length > 0 ? (
          <div className="space-y-4 mb-6">
            {teamInfo.teamMembers.map((member, index) => (
              <div key={member.memberId || `member-${index}`} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="flex items-center">
                  {member.memberAvatar && (
                    <img 
                      src={member.memberAvatar} 
                      alt={member.memberName || 'Team member'} 
                      className="h-10 w-10 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <h4 className="text-md font-medium text-gray-900">{member.memberName || 'Team member'}</h4>
                    <p className="text-sm text-gray-600">{member.teamRole || 'Member'}</p>
                    {member.memberEmail && (
                      <p className="text-xs text-gray-500">{member.memberEmail}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">No Team Members Found</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You don&apos;t have any team members registered yet. To create and manage your team, please visit 
                    your <Link href="/team-members" className="text-yellow-800 underline hover:no-underline">team management page</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Link to Update Team Info */}
        <div className="mt-6 flex justify-center">
          <Link href="/team-members" className="inline-flex items-center px-4 py-2 border border-blue-500 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Manage Team
          </Link>
        </div>
      </div>
    </div>
  );
}

// Add prop type validation
FounderProfile.propTypes = {
  formData: PropTypes.object,
  updateFormData: PropTypes.func.isRequired,
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

// Default props
FounderProfile.defaultProps = {
  formData: {},
  projectId: null
};

export default FounderProfile;