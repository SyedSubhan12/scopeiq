"use client";

interface PortalHeaderProps {
    workspaceName: string;
    logoUrl: string | null;
    brandColor: string;
    projectName: string;
    clientName: string | null;
}

export function PortalHeader({
    workspaceName,
    logoUrl,
    brandColor,
    projectName,
    clientName,
}: PortalHeaderProps) {
    return (
        <header
            className="border-b"
            style={{ borderColor: `${brandColor}20` }}
        >
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
                {/* Agency branding */}
                <div className="flex items-center gap-3">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={workspaceName}
                            className="h-8 w-8 rounded-lg object-cover"
                        />
                    ) : (
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                            style={{ backgroundColor: brandColor }}
                        >
                            {workspaceName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                            {workspaceName}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-muted))]">
                            Client Portal
                        </p>
                    </div>
                </div>

                {/* Project + client info */}
                <div className="text-right">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {projectName}
                    </p>
                    {clientName && (
                        <p className="text-xs text-[rgb(var(--text-muted))]">{clientName}</p>
                    )}
                </div>
            </div>
        </header>
    );
}
