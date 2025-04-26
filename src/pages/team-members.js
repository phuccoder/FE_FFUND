import CtaArea from "@/components/CtaArea/CtaArea";
import Header from "@/components/Header/Header";
import Layout from "@/components/Layout/Layout";
import PageTitle from "@/components/Reuseable/PageTitle";
import TeamManagementSection from "@/components/TeamArea/TeamManagementSection";
import NoTeamSection from "@/components/TeamArea/NoTeamSection";
import useTeam from "@/hooks/useTeam";
import React from "react";
import { Container, Alert, Spinner } from "react-bootstrap";

const TeamMembers = () => {
  const { team, loading, error, refreshTeam } = useTeam();

  const isValidTeam = (team) => {
    return team && team.teamId && team.teamName;
  };

  return (
    <Layout>
      <Header />
      <PageTitle title="Team Members" parent="pages" />

      {loading ? (
        <Container className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-3">Loading team information...</p>
        </Container>
      ) : error ? (
        <Container className="py-4">
          <Alert variant="danger">{error}</Alert>
        </Container>
      ) : isValidTeam(team) ? (
        <>
          <TeamManagementSection team={team} onTeamUpdate={refreshTeam} />
          <CtaArea />
        </>
      ) : (
        <NoTeamSection />
      )}


    </Layout>
  );
};

export default TeamMembers;