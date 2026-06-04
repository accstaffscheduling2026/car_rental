import React from 'react';

const STEPS = ['Personal Details', 'Terms & Conditions', 'Payment Details'];

export default function BookingProgress({ step }) {
  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((label, i) => {
          const num = i + 1;
          const isComplete = step > num;
          const isCurrent  = step === num;
          return (
            <React.Fragment key={label}>
              <li className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm border-2
                    ${isComplete ? 'bg-brand-600 border-brand-600 text-white'
                    : isCurrent  ? 'border-brand-600 text-brand-700 bg-white'
                    :              'border-gray-300 text-gray-400 bg-white'}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isComplete
                      ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      : num
                    }
                  </div>
                  <span className={`mt-1 text-xs font-medium hidden sm:block whitespace-nowrap
                    ${isCurrent ? 'text-brand-700' : isComplete ? 'text-brand-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              </li>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${isComplete ? 'bg-brand-600' : 'bg-gray-200'}`} aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </ol>
      <p className="sm:hidden text-sm text-brand-700 font-medium mt-2 text-center">
        Step {step}: {STEPS[step - 1]}
      </p>
    </nav>
  );
}
