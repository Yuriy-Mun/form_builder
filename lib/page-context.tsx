"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

// Объединенный тип контекста
interface PageContextType {
  // PageTitle функциональность
  title: string;
  description: string | null;
  setTitle: (title: string) => void;
  setDescription: (description: string | null) => void;
  setTitleAndDescription: (title: string, description: string | null) => void;
  
  // HeaderComponents функциональность
  rightSideComponents: ReactNode[];
  addRightSideComponent: (component: ReactNode, id: string) => void;
  removeRightSideComponent: (id: string) => void;
  clearRightSideComponents: () => void;
}

interface HeaderComponent {
  id: string;
  component: ReactNode;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageContextProvider({ children }: { children: ReactNode }) {
  // PageTitle состояние
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string | null>(null);
  
  // HeaderComponents состояние
  const [rightSideComponents, setRightSideComponents] = useState<HeaderComponent[]>([]);
  
  // PageTitle методы
  const setTitleAndDescription = useCallback((title: string, description: string | null) => {
    setTitle(title);
    setDescription(description);
  }, []);

  // HeaderComponents методы
  const addRightSideComponent = useCallback((component: ReactNode, id: string) => {
    setRightSideComponents(prev => {
      // Check if component with this id already exists
      const exists = prev.some(comp => comp.id === id);
      
      if (exists) {
        // Replace existing component
        return prev.map(comp => comp.id === id ? { id, component } : comp);
      } else {
        // Add new component
        return [...prev, { id, component }];
      }
    });
  }, []);
  
  const removeRightSideComponent = useCallback((id: string) => {
    setRightSideComponents(prev => prev.filter(comp => comp.id !== id));
  }, []);
  
  const clearRightSideComponents = useCallback(() => {
    setRightSideComponents([]);
  }, []);

  return (
    <PageContext.Provider value={{ 
      // PageTitle values
      title, 
      description,
      setTitle, 
      setDescription,
      setTitleAndDescription,
      
      // HeaderComponents values
      rightSideComponents: rightSideComponents.map(item => item.component),
      addRightSideComponent, 
      removeRightSideComponent,
      clearRightSideComponents
    }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePage() {
  const context = useContext(PageContext);
  
  if (context === undefined) {
    throw new Error("usePage must be used within a PageContextProvider");
  }
  
  return context;
}

// Компонент для установки заголовка страницы
export function SetPageTitle({ 
  title, 
  description = null 
}: { 
  title: string; 
  description?: string | null
}) {
  const { setTitleAndDescription } = usePage();
  
  React.useEffect(() => {
    setTitleAndDescription(title, description);
    
    // Clean up when component unmounts
    return () => setTitleAndDescription("", null);
  }, [title, description, setTitleAndDescription]);
  
  return null;
}

// Компонент для добавления компонентов в хедер
export function UseHeaderComponent({ 
  id, 
  children 
}: { 
  id: string; 
  children: ReactNode;
}) {
  const { addRightSideComponent, removeRightSideComponent } = usePage();
  
  React.useEffect(() => {
    addRightSideComponent(children, id);
    
    // Clean up when component unmounts
    return () => removeRightSideComponent(id);
  }, [id, children, addRightSideComponent, removeRightSideComponent]);
  
  return null;
}

// Компонент заголовка
export function PageTitle() {
  const { title, description } = usePage();
  
  if (!title) return null;
  
  return (
    <div className="flex flex-col">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  );
} 