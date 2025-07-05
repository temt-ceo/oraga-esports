# 【 Strengths of Oraga eSports 】

As an explanation of the eSports game

1. Win the game.
2. The game prize is sent to your wallet automatically in realtime.
3. Sell it at crypt exchange.

This streamlined process, from game start to cryptocurrency sale at an exchange, addresses the previous fragmentation where games and exchanges operated separately, creating a complex system that deterred newcomers. By intuitively conveying that all desired actions can be completed within 1.5 minutes, we have eliminated gamers' resistance. Additionally, by adopting an intuitive user interface, I am confident that we can effectively onboard new users.
<br><br>
■ Oraga eSports launches its first game, a shooting game
<br><br>

The system benefits both game developers and players, and the use of real-time communication technology allows players to track the progress of prizes in real time. The blog explains the advantages of adopting Interaction Templates, which enable secure transactions, into large-scale eSports platforms, and how anyone can build games, provide them securely, and generate profits.
<br><br>
Oraga eSports Development Blog: https://medium.com/@tickets.on.flow
<br><br>

# Functional requirements:

1. Ability to deposit money and start the game.
2. Receive prize money when winning a game.
3. Add 1 FLOW to the prize amount when losing a game.
4. Provide a tip jar feature to allow one free play for those without FLOW (withdraw 1 FLOW from the tip jar and use it to play the game).
5. Donate (1 FLOW) to the tip jar.
6. Record wins and losses on the blockchain.

<br><br>

# Svelte + Vite

This template should help get you started developing with Svelte in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `checkJs` in the JS template?**

It is likely that most cases of changing variable types in runtime are likely to be accidental, rather than deliberate. This provides advanced typechecking out of the box. Should you like to take advantage of the dynamically-typed nature of JavaScript, it is trivial to change the configuration.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/sveltejs/svelte-hmr/tree/master/packages/svelte-hmr#preservation-of-local-state).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```js
// store.js
// An extremely simple external store
import { writable } from "svelte/store";
export default writable(0);
```
