# AI Workspace Sidebar Shell

Replace the placeholder AI panel in the editor room with a polished,
interactive workspace shell matching the supplied visual reference.

## Implementation

1. Keep the AI workspace room-only.
   - preserve the existing navbar AI toggle
   - keep the editor home unchanged
   - keep the panel as a floating right-side canvas overlay
   - provide an in-panel close action

2. Add the workspace header.
   - show a compact AI icon, `AI Workspace`, and
     `Collaborate with Ghost AI`
   - keep the close action aligned to the top-right
   - separate the header from the body with the existing border token

3. Add local workspace tabs.
   - provide `AI Architect` and `Specs`
   - use a compact segmented control
   - give the active tab the AI accent treatment
   - tab switching is client-side shell state only

4. Build the AI Architect empty state.
   - show the AI icon, `Camely AI Architect`, and concise
     architecture guidance
   - provide three prompt suggestions:
     - `Design an e-commerce backend`
     - `Create a chat app architecture`
     - `Build a CI/CD pipeline`
   - clicking a suggestion places it in the composer and focuses the input

5. Build the prompt composer.
   - anchor it to the bottom of the panel
   - support multiline text with Shift+Enter
   - submit non-empty prompts with Enter or the Send button
   - show submitted prompts locally in the shell
   - keep actual AI generation, persistence, and background tasks out of scope

6. Build the Specs shell state.
   - show a full-width `Generate Spec` action
   - show a versioned `System Architecture` preview card with a
     concise architecture summary
   - increment the preview version locally when Generate Spec is
     selected
   - show a disabled Download control until persisted spec
     generation is connected
   - do not add spec-generation behavior in this feature

## Scope Limits

- do not add an AI provider or model call
- do not add API routes or background tasks
- do not mutate Liveblocks canvas state
- do not change the editor navbar or project sidebar behavior

## Check When Done

- The room AI toggle opens and closes the polished workspace panel.
- The panel close action works.
- Architect and Specs tabs switch locally.
- Specs shows the generation action and versioned preview card.
- Suggestions populate and focus the prompt composer.
- Enter submits, Shift+Enter adds a line, and empty prompts cannot submit.
- Submitted prompts appear in the local shell.
- The editor home is unchanged.
