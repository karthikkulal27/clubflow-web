export function useDynamicColors() {
  const getPrimaryColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#2563eb';
  };

  const getSecondaryColor = () => {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim() || '#3b82f6';
  };

  return {
    primary: getPrimaryColor(),
    secondary: getSecondaryColor(),
  };
}
