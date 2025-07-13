// Support categories for different user types
export const TOUR_GUIDE_CATEGORIES = {
  safety: 'Safety Concerns',
  harassment: 'Harassment/Discrimination', 
  workplace: 'Workplace Conditions',
  payment: 'Payment Issues',
  equipment: 'Equipment/Resources',
  management: 'Management Issues',
  customer: 'Customer Behavior',
  scheduling: 'Scheduling Problems',
  training: 'Training Issues',
  other: 'Other'
};

export const VENDOR_CATEGORIES = {
  technical: 'Technical Issue',
  account: 'Account Help', 
  billing: 'Billing Issue',
  feature_request: 'Feature Request',
  bug_report: 'Bug Report',
  other: 'Other'
};

// Combined categories
export const ALL_SUPPORT_CATEGORIES = {
  ...TOUR_GUIDE_CATEGORIES,
  ...VENDOR_CATEGORIES
};

// Support status options
export const SUPPORT_STATUS = {
  open: 'Open',
  in_progress: 'In Progress', 
  resolved: 'Resolved',
  closed: 'Closed'
};

// Urgency levels
export const URGENCY_LEVELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

// User types
export const USER_TYPES = {
  TRAVEL_GUIDE: 'Travel Guide',
  VENDOR: 'Vendor'
};

// Status colors for UI
export const STATUS_COLORS = {
  open: 'red',
  in_progress: 'blue', 
  resolved: 'green',
  closed: 'gray'
};

// Urgency colors for UI
export const URGENCY_COLORS = {
  low: 'green',
  medium: 'yellow', 
  high: 'orange',
  critical: 'red'
};

// Category colors for UI
export const CATEGORY_COLORS = {
  // Tour Guide categories
  safety: 'red',
  harassment: 'purple',
  workplace: 'amber', 
  payment: 'green',
  equipment: 'blue',
  management: 'indigo',
  customer: 'pink',
  scheduling: 'teal',
  training: 'orange',
  
  // Vendor categories
  technical: 'amber',
  account: 'blue',
  billing: 'green', 
  feature_request: 'purple',
  bug_report: 'red',
  
  // Common
  other: 'gray'
};

export const getCategoryIcon = (category) => {
  const icons = {
    // Tour Guide categories
    safety: 'FiShield',
    harassment: 'FiUser', 
    workplace: 'FiBriefcase',
    payment: 'FiDollarSign',
    equipment: 'FiTool',
    management: 'FiUsers',
    customer: 'FiUser',
    scheduling: 'FiCalendar',
    training: 'FiBook',
    
    // Vendor categories
    technical: 'FiAlertTriangle',
    account: 'FiUser',
    billing: 'FiCreditCard',
    feature_request: 'FiPlus',
    bug_report: 'FiBug',
    
    // Common
    other: 'FiHelpCircle'
  };
  
  return icons[category] || 'FiHelpCircle';
};