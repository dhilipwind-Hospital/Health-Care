import { useState, useEffect } from 'react';

/**
 * Hook to get the currently selected branch from localStorage.
 * This is used for location-based filtering across the application.
 * The branch is set by the SaaSLayout when user switches locations.
 */
export const useSelectedBranch = () => {
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('hms_selected_branch');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const checkLocation = () => {
      try {
        const saved = localStorage.getItem('hms_selected_branch');
        const parsed = saved ? JSON.parse(saved) : null;

        setSelectedBranch((prev: any) => {
          // Only update if ID changed to prevent unnecessary re-renders
          if (prev?.id === parsed?.id) return prev;
          return parsed;
        });
      } catch { }
    };

    // Listen for storage events (cross-tab)
    window.addEventListener('storage', checkLocation);
    
    // Poll for changes within the same tab
    const interval = setInterval(checkLocation, 500);

    return () => {
      window.removeEventListener('storage', checkLocation);
      clearInterval(interval);
    };
  }, []);

  return {
    selectedBranch,
    selectedBranchId: selectedBranch?.id || undefined,
  };
};

export default useSelectedBranch;
