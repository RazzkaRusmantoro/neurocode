'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Section {
  id: string;
  title: string;
  description: string;
  code_references?: string[];
  subsections?: Array<{
    id: string;
    title: string;
    description: string;
    code_references?: string[];
  }>;
}

interface DocumentationData {
  title: string;
  sections: Section[];
  code_references?: string[];
}

interface DocumentationContextType {
  documentation: DocumentationData | null;
  setDocumentation: (doc: DocumentationData | null) => void;
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
}

const DocumentationContext = createContext<DocumentationContextType | undefined>(undefined);

export function DocumentationProvider({ children }: { children: ReactNode }) {
  const [documentation, setDocumentation] = useState<DocumentationData | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <DocumentationContext.Provider value={{ documentation, setDocumentation, activeSection, setActiveSection }}>
      {children}
    </DocumentationContext.Provider>
  );
}

export function useDocumentation() {
  const context = useContext(DocumentationContext);
  if (context === undefined) {
    throw new Error('useDocumentation must be used within a DocumentationProvider');
  }
  return context;
}

