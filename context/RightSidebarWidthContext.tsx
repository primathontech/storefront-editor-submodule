import React, { createContext, useContext, useState } from "react";

interface RightSidebarWidthContextType {
  width: number;
  setWidth: (width: number) => void;
}

const RightSidebarWidthContext = createContext<
  RightSidebarWidthContextType | undefined
>(undefined);

export const RightSidebarWidthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [width, setWidth] = useState(340); // Default 340px for settings sidebar

  return (
    <RightSidebarWidthContext.Provider value={{ width, setWidth }}>
      {children}
    </RightSidebarWidthContext.Provider>
  );
};

export const useRightSidebarWidth = () => {
  const context = useContext(RightSidebarWidthContext);
  if (!context) {
    throw new Error(
      "useRightSidebarWidth must be used within RightSidebarWidthProvider"
    );
  }
  return context;
};
