import { toast } from "@/hooks/use-toast";

interface FormData {
  [key: string]: any;
}

interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
};

// Store form data in localStorage for recovery
export const saveFormData = (formId: string, data: FormData) => {
  try {
    localStorage.setItem(`form_data_${formId}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error saving form data:', error);
  }
};

// Retrieve saved form data
export const getSavedFormData = (formId: string): FormData | null => {
  try {
    const saved = localStorage.getItem(`form_data_${formId}`);
    if (!saved) return null;

    const { data, timestamp } = JSON.parse(saved);
    // Only return data if it's less than 24 hours old
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      return data;
    }
    localStorage.removeItem(`form_data_${formId}`);
    return null;
  } catch (error) {
    console.error('Error retrieving form data:', error);
    return null;
  }
};

// Clear saved form data
export const clearSavedFormData = (formId: string) => {
  localStorage.removeItem(`form_data_${formId}`);
};

// Retry submission with exponential backoff
export const retrySubmission = async (
  submitFn: () => Promise<any>,
  config: RetryConfig = DEFAULT_CONFIG
): Promise<any> => {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 5000 } = config;
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await submitFn();
    } catch (error: any) {
      attempt++;
      if (attempt === maxRetries) {
        throw error;
      }

      console.error(`Submission attempt ${attempt} failed:`, error);
      toast({
        title: `Retrying submission (${attempt}/${maxRetries})`,
        description: "Please wait while we try again...",
      });

      // Exponential backoff with jitter
      delay = Math.min(delay * 2, maxDelay);
      const jitter = delay * 0.2 * Math.random();
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
};

// Main error recovery handler
export const handleFormSubmission = async <T>(
  formId: string,
  data: FormData,
  submitFn: () => Promise<T>,
  config?: RetryConfig
): Promise<T> => {
  // Save form data before submission
  saveFormData(formId, data);

  try {
    // Attempt submission with retry logic
    const result = await retrySubmission(submitFn, config);
    // Clear saved data on success
    clearSavedFormData(formId);
    return result;
  } catch (error: any) {
    // If all retries fail, keep the data saved for recovery
    toast({
      title: "Submission failed",
      description: "Your form data has been saved. You can try again later.",
      variant: "destructive",
    });
    throw error;
  }
};
