import React, { createContext, useContext, useEffect, useState } from "react";
import { getClubBranding } from "../lib/members.api";
import { authStore } from "../store/auth.store";

interface ClubBranding {
  id: string;
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  slogan?: string | null;
}

interface BrandingContextType {
  branding: ClubBranding | null;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({ branding: null, isLoading: true });

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<ClubBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Apply default colors immediately (before async fetch)
    document.documentElement.style.setProperty("--color-primary", "#2563eb");
    document.documentElement.style.setProperty("--color-secondary", "#3b82f6");

    const fetchBranding = async () => {
      // Only fetch if user is authenticated
      if (!authStore.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getClubBranding();
        setBranding(data);

        // Apply custom colors as CSS variables
        const primaryColor = (data.primaryColor || '#2563eb').toLowerCase();
        const secondaryColor = (data.secondaryColor || '#3b82f6').toLowerCase();

        console.log('BrandingProvider applying colors:', { primaryColor, secondaryColor });

        document.documentElement.style.setProperty("--color-primary", primaryColor);
        document.documentElement.style.setProperty("--color-secondary", secondaryColor);
      } catch (err) {
        console.warn("Failed to fetch club branding:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, isLoading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return context;
}
