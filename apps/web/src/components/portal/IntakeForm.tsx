import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "@/hooks/useDebounce";
import { Button, Card, Input, Textarea, useToast } from "@novabots/ui";
import { ChevronRight, ChevronLeft, Send, CheckCircle, AlertCircle } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { cn } from "@novabots/ui";

interface IntakeFormProps {
    brief: {
        id: string;
        title: string;
        fields: any[];
    };
    projectId: string;
    workspaceId: string;
    onSuccess: () => void;
}

export function IntakeForm({ brief, projectId, workspaceId, onSuccess }: IntakeFormProps) {
    const [step, setStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const { toast } = useToast();
    const [prediction, setPrediction] = useState<{ score: number; feedback: string; is_clear: boolean } | null>(null);
    const [isPredicting, setIsPredicting] = useState(false);

    const totalSteps = brief.fields.length;
    const currentField = brief.fields[step] ?? { fieldKey: "_placeholder", fieldLabel: "", fieldType: "text", fieldDescription: "" };

    const watchedValue = watch(currentField.fieldKey);
    const debouncedValue = useDebounce(watchedValue, 1000);

    useEffect(() => {
        if (debouncedValue && typeof debouncedValue === "string" && debouncedValue.length > 10) {
            void handleCheckClarity(debouncedValue);
        } else {
            setPrediction(null);
        }
    }, [debouncedValue]);

    const handleCheckClarity = async (value: string) => {
        setIsPredicting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/v1/ai/predict-clarity`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    field_label: currentField.fieldLabel,
                    field_value: value
                })
            });
            const data = await res.json();
            setPrediction(data);
        } catch (err) {
            console.error("Clarity prediction failed", err);
        } finally {
            setIsPredicting(false);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            // Map form responses to the required format
            const responses = brief.fields.map(field => ({
                field_key: field.fieldKey,
                value: data[field.fieldKey] || ""
            }));

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/briefs/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    template_id: null, // We are submitting against an existing brief record
                    project_id: projectId,
                    workspace_id: workspaceId,
                    title: brief.title,
                    responses
                })
            });

            if (!res.ok) throw new Error("Submission failed");

            setSubmitted(true);
            toast("success", "Brief submitted successfully!");
            setTimeout(onSuccess, 3000);
        } catch (err) {
            toast("error", "Failed to submit brief. Please try again.");
        }
    };

    if (submitted) {
        return (
            <Card className="max-w-2xl mx-auto py-16 text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Thank you!</h2>
                <p className="text-[rgb(var(--text-muted))] mt-2">
                    Your project brief has been submitted successfully.
                    Your agency will review it and get back to you soon.
                </p>
            </Card>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">
                        Step {step + 1} of {totalSteps}
                    </span>
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                        {Math.round(((step + 1) / totalSteps) * 100)}% Complete
                    </span>
                </div>
                <div className="h-1.5 w-full bg-[rgb(var(--surface-subtle))] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

            <Card className="p-8 shadow-xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="min-h-[200px]">
                        <h3 className="text-lg font-bold text-[rgb(var(--text-primary))] mb-2">
                            {currentField.fieldLabel}
                        </h3>
                        <p className="text-sm text-[rgb(var(--text-muted))] mb-6 italic">
                            {currentField.fieldDescription || "Please provide as much detail as possible for this section."}
                        </p>

                        {currentField.fieldType === "textarea" ? (
                            <Textarea
                                {...register(currentField.fieldKey, { required: true })}
                                placeholder="Type your response here..."
                                rows={6}
                                className="w-full text-base"
                            />
                        ) : (
                            <Input
                                {...register(currentField.fieldKey, { required: true })}
                                placeholder="Enter details..."
                                className="w-full text-base"
                            />
                        )}

                        {/* AI Clarity Nudge */}
                        {prediction && (
                            <div className={cn(
                                "mt-4 p-3 rounded-lg border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300",
                                prediction.is_clear ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
                            )}>
                                <div className={cn(
                                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white font-bold text-[10px]",
                                    prediction.is_clear ? "bg-emerald-500" : "bg-amber-500"
                                )}>
                                    {prediction.score}
                                </div>
                                <p className={cn(
                                    "text-xs font-medium leading-relaxed",
                                    prediction.is_clear ? "text-emerald-800" : "text-amber-800"
                                )}>
                                    {prediction.feedback}
                                </p>
                            </div>
                        )}

                        {errors[currentField.fieldKey] && (
                            <p className="text-xs text-status-red mt-2 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> This field is required
                            </p>
                        )}
                    </div>

                    <div className="mt-12 flex items-center justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setStep(s => s - 1)}
                            disabled={step === 0}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>

                        {step < totalSteps - 1 ? (
                            <Button
                                type="button"
                                onClick={() => {
                                    // Manual validation check for required fields before moving next
                                    const val = watch(currentField.fieldKey);
                                    if (!val) {
                                        toast("error", "Please fill out this field to continue");
                                        return;
                                    }
                                    setStep(s => s + 1);
                                }}
                            >
                                Next Step
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="submit" className="bg-primary hover:bg-primary-mid">
                                Submit Brief
                                <Send className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </form>
            </Card>

            <p className="text-center text-[10px] text-[rgb(var(--text-muted))] mt-6 uppercase tracking-widest font-medium">
                Powered by ScopeIQ &bull; Secure Client Portal
            </p>
        </div>
    );
}

