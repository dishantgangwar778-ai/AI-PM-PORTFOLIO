import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import posthog from 'posthog-js';
import { UserProfile } from '../types';

interface Props {
  setCurrentView: (view: string) => void;
  setIsUploadStepperOpen: (open: boolean) => void;
}

export function OnboardingWidget({ setCurrentView, setIsUploadStepperOpen }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [progress, setProgress] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
    completed: false
  });

  useEffect(() => {
    // Basic fetch to check user session
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.onboardingProgress) {
          setProgress(data.user.onboardingProgress);
        }
        if (data.user?.token) {
          setToken(data.user.token);
        }
      })
      .catch(() => {});
  }, []);

  const handleCompleteStep = async (step: number, actionFn: () => void) => {
    actionFn(); // Do the UI action
    
    // Optimistic UI update
    setProgress(prev => {
      const next = { ...prev, [`step${step}`]: true };
      next.completed = next.step1 && next.step2 && next.step3 && next.step4 && next.step5;
      return next as any;
    });

    try {
      await fetch('/api/auth/onboarding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ step })
      });
      
      // Track in PostHog
      if (posthog.__loaded) {
        posthog.capture(`completed_step_${step}`);
      }
    } catch (err) {
      console.error('Failed to update onboarding progress', err);
    }
  };

  if (progress.completed) return null;

  const steps = [
    { num: 1, title: 'Upload your first returns dataset', action: () => setIsUploadStepperOpen(true) },
    { num: 2, title: 'Review the Dashboard metrics', action: () => setCurrentView('dashboard') },
    { num: 3, title: 'View Problematic Products', action: () => setCurrentView('deepdive') },
    { num: 4, title: 'Review an Action Plan', action: () => setCurrentView('actions') },
    { num: 5, title: 'Convert an Action to an Experiment', action: () => setCurrentView('experiments') },
  ];

  const completedCount = Object.values(progress).filter(v => v === true).length - (progress.completed ? 1 : 0);

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-40 transition-all duration-300">
      <div 
        className="bg-slate-900 text-white p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-sm">Getting Started</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium bg-slate-800 px-2 py-1 rounded-full text-slate-300">
            {completedCount}/5
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="p-2 bg-slate-50">
          <div className="space-y-1">
            {steps.map((step) => {
              const isDone = progress[`step${step.num}` as keyof typeof progress];
              return (
                <button
                  key={step.num}
                  onClick={() => handleCompleteStep(step.num, step.action)}
                  disabled={isDone as boolean}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${isDone ? 'opacity-60 cursor-default' : 'hover:bg-slate-100 cursor-pointer'}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm font-medium ${isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
