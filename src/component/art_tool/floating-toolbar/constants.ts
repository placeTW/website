// Mobile-friendly styles for touch interfaces
export const mobileStyles = {
  '& button': {
    minHeight: '44px', // Minimum touch target size
    minWidth: '44px',
  },
  '& input': {
    minHeight: '44px',
    fontSize: '16px', // Prevent zoom on iOS
  },
};