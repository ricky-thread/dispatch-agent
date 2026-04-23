# Cursor Setup Prompt

Open this folder in Cursor, then paste the prompt below into the chat.

When Cursor pauses and asks for your files (step 5), open `App.jsx` and `constants.js` from this folder and paste their contents into the chat.

---

## The prompt

```
I have a React prototype I want to stand up as a new Vite project, run locally, and push to my personal GitHub. The prototype files (App.jsx, constants.js) are already in this folder — you'll use them in step 5. First, set up the project.

## Setup steps

1. Create a new Vite + React project inside this folder called `auto-dispatch`:
   - Run `npm create vite@latest auto-dispatch -- --template react`
   - `cd auto-dispatch`
   - Run `npm install`

2. Install Tailwind CSS v4 using the Vite plugin approach:
   - Run `npm install -D tailwindcss @tailwindcss/vite`
   - Update `vite.config.js` to include the Tailwind plugin AND a path alias for `@` pointing to `./src`:
     ```js
     import { defineConfig } from "vite";
     import react from "@vitejs/plugin-react";
     import tailwindcss from "@tailwindcss/vite";
     import path from "path";

     export default defineConfig({
       plugins: [react(), tailwindcss()],
       resolve: {
         alias: {
           "@": path.resolve(__dirname, "./src"),
         },
       },
     });
     ```
   - Replace the entire contents of `src/index.css` with just: `@import "tailwindcss";`

3. Install `lucide-react` for icons:
   - Run `npm install lucide-react`

4. Set up shadcn/ui and install the Switch component:
   - Run `npx shadcn@latest init` (accept defaults; if it needs `jsconfig.json` or `components.json`, create whatever it asks for)
   - Run `npx shadcn@latest add switch`
   - Verify `src/components/ui/switch.jsx` exists afterward

5. Copy my prototype files into the project:
   - Replace `auto-dispatch/src/App.jsx` with the contents of `App.jsx` in the parent folder
   - Create `auto-dispatch/src/constants.js` with the contents of `constants.js` in the parent folder
   - Confirm `src/main.jsx` imports and renders `./App` (the default Vite template already does this — just verify)

6. Run `npm run dev` and confirm it starts without errors.

## Git + GitHub steps (after the app runs)

7. Initialize the git repo inside `auto-dispatch`:
   - `git init`
   - `git add .`
   - `git commit -m "Initial prototype"`

8. Help me push this to a new GitHub repo under my personal account. Ask me for:
   - My GitHub username
   - The repo name I want (suggest `auto-dispatch-prototype`)
   - Whether it should be public or private

   Then give me the exact `gh repo create` command (using the GitHub CLI) or the manual steps if I don't have `gh` installed.

## Troubleshooting

If anything fails, tell me what broke before moving on rather than guessing a fix.
```

---

## Notes

- **Run Cursor from this folder.** The setup creates an `auto-dispatch` subfolder inside wherever you open Cursor.
- **If shadcn's init asks about TypeScript,** say no (the code is JSX, not TSX).
- **Install the GitHub CLI first** if you want the one-liner push: `brew install gh && gh auth login`.
