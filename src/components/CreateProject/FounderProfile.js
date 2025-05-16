import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Link from '../Reuseable/Link';
import { getUserExtendedInfo } from '../../services/userService';
import { getTeamById, getUserTeam, getTeamMemberDetail } from '../../services/teamService';

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
  const [memberPortfolios, setMemberPortfolios] = useState({});
  const [loadingMembers, setLoadingMembers] = useState([]);

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

  useEffect(() => {
    // Skip calculation if no updateFormData function is provided
    if (typeof updateFormData !== 'function') return;
    
    const calculateFounderCompletion = () => {
      // Extract founder profile data
      const founderProfile = formData || {};
      
      // Check for user information in various locations
      const userInfo = founderProfile.userInfo || founderProfile.user || founderProfile;
      
      // Get basic info
      const fullName = userInfo.fullName || userInfo.name || '';
      const email = userInfo.email || '';
      const phone = userInfo.phone || userInfo.phoneNumber || '';
      
      // Get team information
      const team = founderProfile.team || [];
      
      // Check for student info
      const studentInfo = founderProfile.studentInfo || userInfo.studentInfo || {};
      const hasStudentInfo = studentInfo && Object.values(studentInfo).some(val => !!val);
      
      // Calculate completion score
      let completed = 0;
      const total = 4; // Required fields
      
      if (fullName) completed++;
      if (email) completed++;
      if (phone) completed++;
      if (hasStudentInfo) completed++;
      
      // Team bonus
      let teamBonus = 0;
      if (team && Array.isArray(team) && team.length > 0) {
        teamBonus = 0.5;
      }
      
      // Final percentage with bonus
      const basePercentage = Math.round(((completed) / total) * 100);
      return Math.min(100, basePercentage + (teamBonus * 20)); // Add up to 20% for team
    };
    
    // Calculate current percentage
    const completionPercentage = calculateFounderCompletion();
    
    // Only update if the value has changed to avoid infinite loops
    if (formData?._completionPercentage !== completionPercentage) {
      // Create a copy of formData with completion percentage
      const updatedFormData = {
        ...formData,
        _completionPercentage: completionPercentage
      };
      // Update parent component
      updateFormData(updatedFormData);
    }
  }, [formData, updateFormData]);

  // Separate function to process user data and fetch team data
  const processUserAndTeamData = async (userData) => {
    try {
      const teamResponse = await getUserTeam();
      console.log('Team Response:', teamResponse);

      const teamData = teamResponse;

      if (teamData) {
        setTeamInfo(teamData);
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
          teamId: teamData.teamId,
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

  const generateAvatar = (name) => {
    const colors = ["#F59E0B", "#10B981", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444"];

    // Get consistent color based on name
    const getColorFromName = (name) => {
      let hash = 0;
      if (!name) return colors[0];
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    // Get initials from name
    const getInitials = (name) => {
      if (!name) return '?';
      const names = name.split(' ');
      if (names.length === 1) return names[0].charAt(0).toUpperCase();
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    return {
      bgColor: getColorFromName(name),
      initials: getInitials(name)
    };
  };

  useEffect(() => {
    if (!teamInfo?.teamMembers?.length) return;

    // Set initial loading state for all members
    setLoadingMembers(teamInfo.teamMembers.map(m => m.memberId));

    // Pre-populate portfolios object with null values
    const initialPortfolios = {};
    teamInfo.teamMembers.forEach(member => {
      initialPortfolios[member.memberId] = null;
    });
    setMemberPortfolios(initialPortfolios);

    // Create a flag to track component mount status
    let isMounted = true;

    const checkMemberPortfolios = async () => {
      console.log("Checking portfolios for team members");
      const portfolioStatuses = { ...initialPortfolios };

      // CASE 1: First check if current user data is available in userInfo
      if (userInfo && userInfo.studentPortfolio) {
        console.log("Current user has portfolio:", userInfo.studentPortfolio);

        // Find if current user is a team member
        const currentUserAsMember = teamInfo.teamMembers.find(
          member => member.memberEmail === userInfo.user.email
        );

        if (currentUserAsMember) {
          console.log("Current user found in team members, ID:", currentUserAsMember.memberId);
          portfolioStatuses[currentUserAsMember.memberId] = userInfo.studentPortfolio;

          // Safe update of loading state if component is still mounted
          if (isMounted) {
            setLoadingMembers(prev => prev.filter(id => id !== currentUserAsMember.memberId));
            setMemberPortfolios(prev => ({
              ...prev,
              [currentUserAsMember.memberId]: userInfo.studentPortfolio
            }));
          }
        }
      }

      // CASE 2: Process each team member
      for (const member of teamInfo.teamMembers) {
        // Skip if we already have portfolio data for this member (e.g., current user)
        if (portfolioStatuses[member.memberId]) {
          console.log(`Skipping fetch for member ${member.memberId} - already has portfolio`);
          continue;
        }

        try {
          console.log(`Fetching details for member ${member.memberId}`);
          const memberDetail = await getTeamMemberDetail(member.memberId);
          console.log(`Member ${member.memberId} detail:`, memberDetail);

          // Handle both response formats
          const portfolioUrl =
            memberDetail.studentPortfolio ||
            (memberDetail.data && memberDetail.data.studentPortfolio);

          // Update status for this member
          portfolioStatuses[member.memberId] = portfolioUrl || null;

          // Update component state if still mounted
          if (isMounted) {
            console.log(`Setting portfolio for member ${member.memberId}:`, portfolioUrl);
            setMemberPortfolios(prev => ({
              ...prev,
              [member.memberId]: portfolioUrl || null
            }));
            setLoadingMembers(prev => prev.filter(id => id !== member.memberId));
          }
        } catch (error) {
          console.error(`Failed to fetch details for member ${member.memberId}:`, error);

          // Update with null value for error cases
          if (isMounted) {
            setMemberPortfolios(prev => ({
              ...prev,
              [member.memberId]: null
            }));
            setLoadingMembers(prev => prev.filter(id => id !== member.memberId));
          }
        }
      }

      // Final update to ensure all members have been processed
      if (isMounted) {
        console.log("Final portfolio statuses:", portfolioStatuses);
        setMemberPortfolios(portfolioStatuses);
        setLoadingMembers([]); // Clear any remaining loading states
      }
    };

    // Execute the portfolio check
    checkMemberPortfolios();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [teamInfo, userInfo]);

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
              {userInfo.user.userAvatar ? (
                <img
                  src={userInfo.user.userAvatar}
                  alt={userInfo.user.fullName || 'User'}
                  className="h-20 w-20 rounded-full object-cover mr-4"
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-full mr-4 flex items-center justify-center text-white text-xl font-medium"
                  style={{ backgroundColor: generateAvatar(userInfo.user.fullName).bgColor }}
                >
                  {generateAvatar(userInfo.user.fullName).initials}
                </div>
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
          </div>
        )}

        {/* Team Members List - UPDATED with generated avatars and portfolio warnings */}
        <div className="mb-4 flex justify-between items-center">
          <h4 className="text-md font-medium text-gray-800">Team Members</h4>
          {Object.values(memberPortfolios).some(p => p === null) && (
            <div className="text-sm font-medium bg-amber-100 text-amber-800 py-1 px-3 rounded-md flex items-center border border-amber-300">
              <svg className="h-4 w-4 mr-1 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Some members need portfolios for submission</span>
            </div>
          )}
        </div>

        {teamInfo && teamInfo.teamMembers && teamInfo.teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {teamInfo.teamMembers.map((member, index) => {
              // Generate avatar for this member
              const avatar = generateAvatar(member.memberName);
              const hasPortfolio = memberPortfolios[member.memberId] !== null;
              const isLoading = loadingMembers.includes(member.memberId);

              return (
                <div
                  key={member.memberId || `member-${index}`}
                  className={`bg-white p-4 rounded-md shadow-sm ${!hasPortfolio && !isLoading
                    ? 'border-2 border-amber-400 bg-amber-50'
                    : 'border border-gray-200'
                    }`}
                >
                  <div className="flex items-center">
                    {member.memberAvatar ? (
                      <img
                        src={member.memberAvatar}
                        alt={member.memberName || 'Team member'}
                        className="h-12 w-12 rounded-full mr-3 object-cover border border-gray-200"
                      />
                    ) : (
                      <div
                        className="h-12 w-12 rounded-full mr-3 flex items-center justify-center text-white text-lg font-medium border border-gray-200"
                        style={{ backgroundColor: avatar.bgColor }}
                      >
                        {avatar.initials}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium text-gray-900">{member.memberName || 'Team member'}</h4>

                        {/* Portfolio status indicator with tooltips - FIXED VERSION */}
                        <div className="relative">
                          {isLoading ? (
                            <div className="inline-block group">
                              <svg className="animate-spin h-4 w-4 text-gray-500 ml-2 cursor-help" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 w-48 p-2 bg-gray-800 text-xs text-white rounded shadow-lg bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1">
                                Checking portfolio status...
                              </div>
                            </div>
                          ) : memberPortfolios[member.memberId] ? (
                            <div className="inline-block relative">
                            <div
                              className="bg-green-100 text-green-800 rounded-full p-0.5 cursor-help"
                              onMouseEnter={(e) => {
                                const tooltip = e.currentTarget.nextElementSibling;
                                if (tooltip) tooltip.classList.remove('hidden');
                              }}
                              onMouseLeave={(e) => {
                                const tooltip = e.currentTarget.nextElementSibling;
                                if (tooltip) tooltip.classList.add('hidden');
                              }}
                            >
                              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="hidden absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 z-50 w-64 p-3 bg-gray-800 text-xs text-white rounded shadow-xl">
                              <div className="relative pb-2">
                                <p className="font-medium text-xs mb-1">Portfolio Verified ✓</p>
                                <p className="text-gray-300 text-xs">This member has completed their profile</p>
                                <div className="absolute w-3 h-3 bg-gray-800 transform rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2"></div>
                              </div>
                            </div>
                          </div>
                          ) : (
                            <div className="inline-block group">
                              <div className="bg-red-100 text-red-800 rounded-full p-0.5 cursor-help">
                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 w-64 p-3 bg-gray-800 text-xs text-white rounded shadow-xl">
                                <div className="relative">
                                  <div className="absolute w-3 h-3 bg-gray-800 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                                  <p className="font-medium text-xs mb-1">Portfolio Required ⚠️</p>
                                  <p className="text-gray-300 text-xs">This team member needs to upload a portfolio document before project submission is allowed.</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{member.teamRole || 'Member'}</p>
                      {member.memberEmail && (
                        <p className="text-xs text-gray-500">{member.memberEmail}</p>
                      )}

                      {/* Portfolio warning with enhanced colors - only if checked and missing */}
                      {!isLoading && !hasPortfolio && memberPortfolios[member.memberId] === null && (
                        <p className="mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-md border border-red-300 flex items-center">
                          <svg className="h-3.5 w-3.5 mr-1 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Portfolio required for submission!
                        </p>
                      )}

                      {/* Portfolio link with enhanced style - if available */}
                      {!isLoading && hasPortfolio && memberPortfolios[member.memberId] && (
                        <a
                          href={memberPortfolios[member.memberId]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md border border-blue-200 inline-flex items-center hover:bg-blue-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Portfolio
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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