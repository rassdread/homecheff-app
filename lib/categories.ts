// Centralized category definitions for the entire application
export const CATEGORIES = {
  CHEFF: {
    label: "Chef",
    icon: "🍳",
    subcategories: ["Ontbijt", "Lunch", "Diner", "Snacks", "Desserts"]
  },
  GROWN: {
    label: "Garden", 
    icon: "🌱",
    subcategories: ["Groenten", "Fruit", "Kruiden", "Bloemen", "Planten"]
  },
  DESIGNER: {
    label: "Designer",
    icon: "🎨", 
    subcategories: ["Kleding", "Accessoires", "Woondecoratie", "Kunst", "Handwerk"]
  }
} as const;

// Map database category values to display values
export const CATEGORY_MAPPING = {
  'CHEFF': 'CHEFF',
  'GROWN': 'GROWN',
  'DESIGNER': 'DESIGNER'
} as const;

// Helper function to get filtered categories based on role
export const getFilteredCategories = (activeRole: string) => {
  if (activeRole === 'chef') {
    return { CHEFF: CATEGORIES.CHEFF };
  } else if (activeRole === 'garden') {
    return { GROWN: CATEGORIES.GROWN };
  } else if (activeRole === 'designer') {
    return { DESIGNER: CATEGORIES.DESIGNER };
  } else {
    // If no specific role or generic, show all categories
    return CATEGORIES;
  }
};

// Type definitions
export type CategoryKey = keyof typeof CATEGORIES;
export type Category = typeof CATEGORIES[CategoryKey];
