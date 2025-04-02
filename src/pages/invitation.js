import Header from "@/components/Header/Header";
import InvitationList from "@/components/Invitation/InvitationList";
import Layout from "@/components/Layout/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PageTitle from "@/components/Reuseable/PageTitle";

const ManageInvitationsPage = () => {
  return (
    <>
      <Layout>
        <Header />
        <PageTitle title="Manage Invitations" />
        <div className="container mx-auto px-4 py-8">

          <div className="bg-orange-50 p-4 mb-6 rounded-lg border border-orange-200">
            <p className="text-orange-800">
              <strong>Note:</strong> Accept or decline invitations to join projects or teams.
              All actions are final once submitted.
            </p>
          </div>

          <InvitationList />
        </div>
      </Layout>
    </>
  );
};

export default function ManageInvitations() {
  return(
    <ProtectedRoute requiredRoles={['FOUNDER']}>
      <ManageInvitationsPage />
    </ProtectedRoute>
  )
}