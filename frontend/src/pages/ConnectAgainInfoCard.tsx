import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

export function ConnectAgainInfoCard({ onClose }) {
    return (
        <Card className="relative w-full max-w-md md:max-w-lg mx-auto bg-background border border-border shadow-xl rounded-xl p-6 md:p-8">
            <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
                <X className="w-5 h-5" />
            </Button>

            <CardHeader>
                <CardTitle className="text-lg md:text-xl font-semibold text-center">
                    Connecting Again
                </CardTitle>
            </CardHeader>

            <CardContent className="text-sm md:text-base text-muted-foreground space-y-3">
                <p>
                    You have already requested to connect with this alumnus, but your previous request was declined.
                </p>
                <p>
                    You are now sending another connection request. If this request is declined again, you won’t be able to send any further requests to this alumnus.
                </p>
            </CardContent>
        </Card>
    );
}
