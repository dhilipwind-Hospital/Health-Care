import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface LocationBranch {
    id: string;
    name: string;
    code?: string;
    city?: string;
    isMainBranch?: boolean;
}

interface LocationContextType {
    selectedLocation: LocationBranch | null;
    setSelectedLocation: (location: LocationBranch | null) => void;
    locationId: string | null; // For API calls
    isAllLocations: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedLocation, setSelectedLocationState] = useState<LocationBranch | null>(() => {
        try {
            const saved = localStorage.getItem('hms_selected_branch');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const setSelectedLocation = (location: LocationBranch | null) => {
        setSelectedLocationState(location);
        try {
            if (location) {
                localStorage.setItem('hms_selected_branch', JSON.stringify(location));
            } else {
                localStorage.removeItem('hms_selected_branch');
            }
        } catch { }
    };

    const value: LocationContextType = {
        selectedLocation,
        setSelectedLocation,
        locationId: selectedLocation?.id || null,
        isAllLocations: !selectedLocation,
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = (): LocationContextType => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

export default LocationContext;
