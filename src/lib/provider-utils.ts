// Utility functions for provider-specific account information

export const getProviderAccountEmail = (provider: string, userEmail: string): string => {
  // Map provider-specific account emails
  switch (provider) {
    case 'azure-ad':
      return 'rahul@satel.ca'; // Outlook account
    case 'google':
      return 'rahulpatidar0191@gmail.com'; // Google account
    case 'notion':
      return userEmail; // Use user email for Notion (or update when known)
    default:
      return userEmail; // Fallback to user email
  }
};

export const getProviderDisplayName = (provider: string): string => {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'azure-ad':
      return 'Outlook';
    case 'notion':
      return 'Notion';
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}; 