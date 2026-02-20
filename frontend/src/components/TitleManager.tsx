import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

const API_USERS_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + "/api/users";

const titles = {
    "/login": "Login",
    "/reset-password": "Reset Password",
    "/register": "Register",
    "/pending-approval": "Account Pending Approval",
    "/verify-student-details": "Verify Student Details",
    "/dashboard": "Dashboard",
    "/notifications": "Notifications",
    "/profile": "My Profile",
    "/saved-referrals": "Saved Referrals",
    "/settings": "Account Settings",
    "/referrals": "Referrals",
    "/connect": "Connect",
    "/my-connections": "My Connections",
    "/post-referral": "Post Referral",
    "/job-details/:id": "Job Details",
    "/quiz/:id": "Quiz",
    "/admin": "Admin Dashboard",
    "/admin/view-all-profiles": "Manage Profiles",
    "/my-referrals": "My Referrals",
    "/view-alumni-profile/:id": "Alumni Profile",
    "/view-student-profile/:id": "Student Profile",
    "/admin/add-event": "Add Event",
    "/admin/approvals": "Alumni Applications",
    "/admin/analytics": "Website Analytics",
    "/admin/activities": "Recent Activities",
};

function TitleManager() {
    const location = useLocation();
    const { user } = useAuth();
    const [recipientName, setRecipientName] = useState(null);

    const pathParts = location.pathname.split("/");
    const recipientId = location.pathname.startsWith("/chat/") ? pathParts[2] : null;

    const fetchRecipientDetails = useCallback(async () => {
        if (!recipientId || !user?.token) return;
        try {
            const response = await fetch(`${API_USERS_BASE_URL}/${recipientId}`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setRecipientName(data.fullName || `User ${recipientId.substring(0, 4)}`);
            } else {
                setRecipientName(`User ${recipientId.substring(0, 4)}`);
            }
        } catch {
            setRecipientName(`User ${recipientId.substring(0, 4)}`);
        }
    }, [recipientId, user?.token]);

    useEffect(() => {
        fetchRecipientDetails();
    }, [fetchRecipientDetails]);

    useEffect(() => {
        if (location.pathname.startsWith("/chat/") && recipientName) {
            document.title = `Chat with ${recipientName}`;
        } else {
            document.title = titles[location.pathname] || "Alumni Connect";
        }
    }, [location, recipientName]);

    return null;
}

export default TitleManager;
