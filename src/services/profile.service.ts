export interface Profile {
  id: string;
  name: string;
  role: string;
  email: string;
}

export const getDemoProfile = (): Profile => ({
  id: "user_demo_001",
  name: "Vestro Demo User",
  role: "operations",
  email: "demo@vestro.local",
});
