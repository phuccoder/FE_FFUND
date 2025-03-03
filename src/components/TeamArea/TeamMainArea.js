import React, { useState, useEffect } from "react";
import { Container, Row, Button, Modal } from "react-bootstrap";
import TeamItem from "./TeamItem";
import { deleteTeam } from "src/services/teamService";
import { useRouter } from "next/router";

const TeamMainArea = ({ 
  className = "", 
  count = 3, 
  teamData = null, 
  isAdmin = false,
  userPermissions = {},
  onTeamUpdate = () => {},
  currentUser = null
}) => {
  // Add component instance ID for debugging
  const instanceId = React.useRef(`team-main-${Math.random().toString(36).substr(2, 9)}`);
  
  const [processedTeamData, setProcessedTeamData] = useState([]);
  
  // Process team data to avoid duplicates
  useEffect(() => {
    console.log(`[${instanceId.current}] Processing team data:`, teamData);
    
    if (!teamData) {
      setProcessedTeamData([]);
      return;
    }
    
    let dataToProcess = [];
    
    try {
      if (teamData.data && teamData.data.teamMembers) {
        // Single team object from API
        dataToProcess = [teamData.data];
        console.log(`[${instanceId.current}] Processing single team with members:`, teamData.data.teamName);
      } else if (teamData.data && Array.isArray(teamData.data)) {
        // Array of teams inside data property
        dataToProcess = teamData.data;
        console.log(`[${instanceId.current}] Processing ${dataToProcess.length} teams from data array`);
      } else if (Array.isArray(teamData)) {
        // Direct array of teams
        dataToProcess = teamData;
        console.log(`[${instanceId.current}] Processing ${dataToProcess.length} teams from direct array`);
      } else if (teamData.teamMembers) {
        // Single team object directly
        dataToProcess = [teamData];
        console.log(`[${instanceId.current}] Processing single team directly:`, teamData.teamName);
      } else {
        console.warn(`[${instanceId.current}] Unrecognized team data format:`, teamData);
        setProcessedTeamData([]);
        return;
      }

      dataToProcess.forEach(team => {
        console.log(`[${instanceId.current}] Team before dedupe: ID=${team.teamId}, Name=${team.teamName}`);
      });
      
      const uniqueTeams = [];
      const teamIds = new Set();
      
      dataToProcess.forEach(team => {
        if (team && team.teamId && !teamIds.has(team.teamId)) {
          teamIds.add(team.teamId);
          uniqueTeams.push(team);
          console.log(`[${instanceId.current}] Added unique team: ${team.teamName} (ID: ${team.teamId})`);
        } else if (team && team.teamId) {
          console.log(`[${instanceId.current}] Skipping duplicate team: ${team.teamName} (ID: ${team.teamId})`);
        } else {
          console.warn(`[${instanceId.current}] Team missing ID:`, team);
        }
      });
      
      console.log(`[${instanceId.current}] Final unique teams count: ${uniqueTeams.length}`);
      setProcessedTeamData(uniqueTeams);
    } catch (err) {
      console.error(`[${instanceId.current}] Error processing team data:`, err);
      setProcessedTeamData([]);
    }
  }, [teamData]);
  
  // Log on each render
  console.log(`[${instanceId.current}] Rendering TeamMainArea with ${processedTeamData.length} teams`);
  
  return (
    <div className={`team-main-area ${className}`} data-instance-id={instanceId.current}>
      <Container>
        <Row className="justify-content-center">
          {processedTeamData.slice(0, count).map((team) => (
            <TeamItem 
              key={`team-${team.teamId || team.id}`}
              team={team}
              isAdmin={isAdmin}
              userPermissions={userPermissions}
              onTeamUpdate={onTeamUpdate}
              currentUser={currentUser}
            />
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default TeamMainArea;