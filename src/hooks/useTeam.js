import { useState, useEffect } from 'react';
import { getUserTeam, convertTeamDataForUI } from '../services/teamService';

/**
 * Custom hook to fetch and manage team data
 * @returns {Object} Team data and state
 */
const useTeam = () => {
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teamData = await getUserTeam();
      setTeam(teamData);
      
      if (teamData) {
        const formattedMembers = convertTeamDataForUI(teamData);
        setTeamMembers(formattedMembers);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
      setError('Failed to load team data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  return {
    team,
    teamMembers,
    loading,
    error,
    refreshTeam: fetchTeam
  };
};

export default useTeam;