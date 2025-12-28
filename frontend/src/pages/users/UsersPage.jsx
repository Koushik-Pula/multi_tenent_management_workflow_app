
import RoleGate from "../../components/common/RoleGate";
import UsersTable from "./UserTable";
import InviteUserModal from "./InviteUserModal";

export default function UsersPage() {
    return (
        <RoleGate allow={["ADMIN"]}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Users</h2>
                    <InviteUserModal />
                </div>

                <UsersTable />
        </RoleGate>
    );
}
