export interface HealthStatus {
  status: string;
  message: string;
  timestamp: string;
}

export const getHealthStatus = async (): Promise<HealthStatus> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: "success",
        message: "Vestro Backend is connected securely!",
        timestamp: new Date().toISOString(),
      });
    }, 800);
  });
};
