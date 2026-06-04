import React from 'react';

export function AlertInfo({ children }) {
  return (
    <div role="status" aria-live="polite"
      className="flex gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 text-sm">
      <svg aria-hidden="true" className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

export function AlertWarning({ children }) {
  return (
    <div role="alert" aria-live="assertive"
      className="flex gap-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg p-4 text-sm">
      <svg aria-hidden="true" className="w-5 h-5 flex-shrink-0 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

export function AlertError({ children }) {
  return (
    <div role="alert" aria-live="assertive"
      className="flex gap-3 bg-red-50 border border-red-300 text-red-800 rounded-lg p-4 text-sm">
      <svg aria-hidden="true" className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

export function AlertSuccess({ children }) {
  return (
    <div role="status" aria-live="polite"
      className="flex gap-3 bg-green-50 border border-green-300 text-green-800 rounded-lg p-4 text-sm">
      <svg aria-hidden="true" className="w-5 h-5 flex-shrink-0 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>{children}</div>
    </div>
  );
}
