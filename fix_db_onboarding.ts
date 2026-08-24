import fs from 'fs';

let code = fs.readFileSync('server/db.ts', 'utf8');

// Add onboardingProgress to User interface
code = code.replace(
  /export interface User \{/,
  `export interface User {
  onboardingProgress?: {
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
    step5: boolean;
    completed: boolean;
  };`
);

// Add initial onboarding state to default user
code = code.replace(
  /createdAt: '2026-06-01T10:00:00Z',(\s*)\};/,
  `createdAt: '2026-06-01T10:00:00Z',$1  onboardingProgress: { step1: true, step2: false, step3: false, step4: false, step5: false, completed: false }$1};`
);

// Add initial onboarding state to new user registration
code = code.replace(
  /createdAt: new Date\(\)\.toISOString\(\),(\s*)\};/,
  `createdAt: new Date().toISOString(),$1  onboardingProgress: { step1: false, step2: false, step3: false, step4: false, step5: false, completed: false }$1};`
);

// Add method to update onboarding progress
const updateMethod = `
  public updateOnboarding(userId: string, step: number): SafeUser | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    
    if (!user.onboardingProgress) {
      user.onboardingProgress = { step1: false, step2: false, step3: false, step4: false, step5: false, completed: false };
    }
    
    switch (step) {
      case 1: user.onboardingProgress.step1 = true; break;
      case 2: user.onboardingProgress.step2 = true; break;
      case 3: user.onboardingProgress.step3 = true; break;
      case 4: user.onboardingProgress.step4 = true; break;
      case 5: user.onboardingProgress.step5 = true; break;
    }
    
    const progress = user.onboardingProgress;
    progress.completed = progress.step1 && progress.step2 && progress.step3 && progress.step4 && progress.step5;
    
    return this.sanitizeUser(user);
  }
`;

code = code.replace(/public getUserByToken/, updateMethod + '\n  public getUserByToken');

fs.writeFileSync('server/db.ts', code);
console.log('Modified db.ts for onboarding tracking');
