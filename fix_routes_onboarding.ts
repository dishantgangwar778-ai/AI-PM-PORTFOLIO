import fs from 'fs';

let code = fs.readFileSync('server/routes.ts', 'utf8');

const onboardingEndpoint = `
router.put('/auth/onboarding', requireAuth, (req: Request, res: Response) => {
  const { step } = req.body;
  if (!step || typeof step !== 'number' || step < 1 || step > 5) {
    return res.status(400).json({ error: 'Invalid step' });
  }
  const updatedUser = db.updateOnboarding(req.user!.id, step);
  if (!updatedUser) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user: updatedUser });
});
`;

code = code.replace(/router\.post\('\/auth\/logout'/, onboardingEndpoint + '\nrouter.post(\'/auth/logout\'');

fs.writeFileSync('server/routes.ts', code);
console.log('Added onboarding route to routes.ts');
