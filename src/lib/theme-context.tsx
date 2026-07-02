"use client";

import { createContext, useContext, useEffect } from "react";

type Theme = "dark";

interface ThemeContextValue {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}
