import React, { createContext, useContext, useState } from "react";

interface SidebarWidthContextType {
  width: number;
  setWidth: (width: number) => void;
}

const SidebarWidthContext = createContext<SidebarWidthContextType | undefined>(
  undefined
);

export const SidebarWidthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [width, setWidth] = useState(320); // Default 320px

  return (
    <SidebarWidthContext.Provider value={{ width, setWidth }}>
      {children}
    </SidebarWidthContext.Provider>
  );
};

export const useSidebarWidth = () => {
  const context = useContext(SidebarWidthContext);
  if (!context) {
    throw new Error("useSidebarWidth must be used within SidebarWidthProvider");
  }
  return context;
};
