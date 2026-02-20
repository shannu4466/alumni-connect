import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'http://localhost:8080/api/users';

interface ApprovalResult {
    message: string;
    userId: string;
    isApproved: boolean;
    applicationStatus: string;
}

export function useAlumniApproval() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);

    const updateAlumniApprovalStatus = useCallback(async (
        alumniId: string,
        approved: boolean
    ): Promise<ApprovalResult | null> => {
        setIsUpdatingApproval(true);
        try {
            if (!user?.token) {
                toast({
                    title: "Authentication Required",
                    description: "You must be logged in as an admin to manage approvals.",
                    variant: "destructive",
                });
                return null;
            }

            if (user.role !== 'admin') {
                toast({
                    title: "Authorization Denied",
                    description: "Only administrators can approve/reject alumni.",
                    variant: "destructive",
                });
                return null;
            }

            const response = await fetch(`${API_BASE_URL}/${alumniId}/approve?status=${approved}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || 'Failed to update approval status.');
            }

            const result: ApprovalResult = await response.json();
            console.log(response, result)

            toast({
                title: approved ? "Alumni approved!" : "Alumni rejected",
                description: approved
                    ? `Account for ${user.fullName} has been approved and activated.`
                    : `Account for ${user.fullName} has been rejected.`,
                variant: approved ? "default" : "destructive",
            });
            return result;
        } catch (error) {
            toast({
                title: "Action Failed",
                description: error instanceof Error ? error.message : "Failed to process the request. Please try again.",
                variant: "destructive",
            });
            return null;
        } finally {
            setIsUpdatingApproval(false);
        }
    }, [user?.token, user?.role, toast]);

    return { updateAlumniApprovalStatus, isUpdatingApproval };
}
