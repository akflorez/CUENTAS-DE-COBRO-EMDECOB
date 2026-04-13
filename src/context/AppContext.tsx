"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type BillingData = {
  [key: string]: any;
};

// Se extiende para soportar multiples archivos
export type FileData = {
  fileName: string;
  data: BillingData[];
  headers: string[];
  referenceDate?: Date;
};

export type AppContextType = {
  // Arreglo de archivos procesados
  filesData: FileData[];
  setFilesData: React.Dispatch<React.SetStateAction<FileData[]>>;
  // Data plana combinada de todos los archivos
  excelData: BillingData[];
  
  // Directorio de Correos
  directoryData: any[];
  setDirectoryData: React.Dispatch<React.SetStateAction<any[]>>;
  
  // Consecutivo inicial
  startingConsecutive: number;
  setStartingConsecutive: (num: number) => void;
  
  clearData: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [filesData, setFilesData] = useState<FileData[]>([]);
  const [directoryData, setDirectoryData] = useState<any[]>([]);
  const [startingConsecutive, setStartingConsecutive] = useState<number>(1);

  // Derivamos la data unificada e inyectamos la fecha de referencia si existe
  const excelData = filesData.flatMap(file => 
    file.data.map(row => ({ ...row, _fileReferenceDate: file.referenceDate }))
  );

  const clearData = () => {
    setFilesData([]);
    setDirectoryData([]);
    setStartingConsecutive(1);
  };

  return (
    <AppContext.Provider value={{ 
      filesData, 
      setFilesData, 
      excelData,
      directoryData,
      setDirectoryData,
      startingConsecutive,
      setStartingConsecutive,
      clearData 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
