---
description: How to safely push changes with TypeScript verification
---

Before pushing any code to the repository, follow these steps to ensure the build won't fail in production:

1. **Verify Local Development**: Ensure `npm run dev` has no runtime errors in the files you modified.
2. **Run Build Check**: Execute the following command in the `frontend` directory:
   ```bash
   npm run build
   ```
   // turbo
3. **Resolve Errors**: If the build fails, fix all syntax and TypeScript errors reported in the terminal.
4. **Git Push**: Only after a successful `npm run build`, proceed with the push:
   ```bash
   git add .
   git commit -m "Your descriptive message"
   git push
   ```
