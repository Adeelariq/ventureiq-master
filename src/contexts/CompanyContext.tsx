"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface CompanyProfile {
  name: string;
  industry: string;
  size: string;
  revenue: string;
  yearFounded: number;
}

interface CompanyContextType {
  company: CompanyProfile | null;
  setCompany: (profile: CompanyProfile) => void;
  clearCompany: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState<CompanyProfile | null>(null);

  const setCompany = (profile: CompanyProfile) => {
    setCompanyState(profile);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ventureiq_company", JSON.stringify(profile));
    }
  };

  const clearCompany = () => {
    setCompanyState(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ventureiq_company");
    }
  };

  // Hydrate on client after mount to keep server/client initial HTML consistent.
  React.useEffect(() => {
    const stored = sessionStorage.getItem("ventureiq_company");
    if (!stored) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompanyState(JSON.parse(stored) as CompanyProfile);
    } catch {
      // Ignore malformed session data.
    }
  }, []);

  return (
    <CompanyContext.Provider value={{ company, setCompany, clearCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
