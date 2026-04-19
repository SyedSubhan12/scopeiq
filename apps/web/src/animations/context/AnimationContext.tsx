"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";

export type OnboardingPhase = 0 | 1 | 2 | 3;
export type TransitionDirection = "forward" | "backward";

interface AnimationState {
    currentPhase: OnboardingPhase;
    direction: TransitionDirection;
    isTransitioning: boolean;
}

type AnimationAction =
    | { type: "GO_NEXT" }
    | { type: "GO_PREV" }
    | { type: "SET_PHASE"; phase: OnboardingPhase }
    | { type: "SET_TRANSITIONING"; value: boolean };

function animationReducer(state: AnimationState, action: AnimationAction): AnimationState {
    switch (action.type) {
        case "GO_NEXT":
            return {
                ...state,
                direction: "forward",
                currentPhase: Math.min(state.currentPhase + 1, 3) as OnboardingPhase,
            };
        case "GO_PREV":
            return {
                ...state,
                direction: "backward",
                currentPhase: Math.max(state.currentPhase - 1, 0) as OnboardingPhase,
            };
        case "SET_PHASE":
            return { ...state, currentPhase: action.phase };
        case "SET_TRANSITIONING":
            return { ...state, isTransitioning: action.value };
        default:
            return state;
    }
}

interface AnimationContextValue {
    state: AnimationState;
    dispatch: React.Dispatch<AnimationAction>;
}

const AnimationContext = createContext<AnimationContextValue | null>(null);

export function AnimationProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(animationReducer, {
        currentPhase: 0,
        direction: "forward",
        isTransitioning: false,
    });

    return (
        <AnimationContext.Provider value={{ state, dispatch }}>
            {children}
        </AnimationContext.Provider>
    );
}

export function useAnimationContext() {
    const ctx = useContext(AnimationContext);
    if (!ctx) throw new Error("useAnimationContext must be inside AnimationProvider");
    return ctx;
}
