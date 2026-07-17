#!/usr/bin/env node
// Watch figures/*.tex and rebuild each on save via fig.sh, so hand-editing a
// figure's TikZ source updates the site SVG live — Astro's HMR then refreshes
// the browser (the post imports the .svg with `?raw`, so the dev server tracks
// it as a dependency).
//
// Usage: run alongside the dev server —
//   npm run dev          (terminal 1)
//   npm run watch:figures (terminal 2)
//
// Uses only Node built-ins; no fswatch/entr/nodemon needed.

import { watch, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { basename } from "node:path";

const DIR = "figures";
const DEBOUNCE_MS = 150; // coalesce editor "save" bursts (many editors write twice)

// name -> timer, so concurrent edits to different figures don't clobber each other
const pending = new Map();
const building = new Set();

function build(name) {
  if (building.has(name)) {
    // A build is in flight; mark it dirty so we re-run once it finishes.
    pending.set(name, null);
    return;
  }
  building.add(name);
  const t0 = Date.now();
  process.stdout.write(`\n⟳ ${name}.tex → building…\n`);

  const proc = spawn("./fig.sh", [name], { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  proc.stdout.on("data", (d) => (out += d));
  proc.stderr.on("data", (d) => (out += d));

  proc.on("close", (code) => {
    building.delete(name);
    if (code === 0) {
      console.log(
        `✓ ${name}.svg updated (${Date.now() - t0}ms) — HMR should refresh the page`,
      );
    } else {
      // Keep the watcher alive on a LaTeX error; show the tail so you can fix the .tex.
      console.error(`✗ ${name}: fig.sh exited ${code}`);
      const tail = out.trim().split("\n").slice(-8).join("\n");
      if (tail) console.error(tail);
    }
    // If edits landed mid-build, rebuild once more.
    if (pending.has(name) && pending.get(name) === null) {
      pending.delete(name);
      build(name);
    }
  });
}

function schedule(name) {
  clearTimeout(pending.get(name));
  pending.set(
    name,
    setTimeout(() => {
      pending.delete(name);
      build(name);
    }, DEBOUNCE_MS),
  );
}

const texCount = readdirSync(DIR).filter((f) => f.endsWith(".tex")).length;
console.log(
  `Watching ${DIR}/*.tex (${texCount} file(s)). Edit a .tex and save to rebuild. Ctrl-C to stop.`,
);

// Real figures are figures/*.tex NOT starting with `_`. Files like _preamble.tex
// and _template.tex are shared includes, not standalone figures.
const isFigure = (name) => !name.startsWith("_");
const figuresOf = () =>
  readdirSync(DIR)
    .filter((f) => f.endsWith(".tex") && isFigure(f))
    .map((f) => basename(f, ".tex"));

watch(DIR, (_event, filename) => {
  if (!filename || !filename.endsWith(".tex")) return;
  const name = basename(filename, ".tex");
  if (isFigure(name)) {
    schedule(name); // a figure changed → rebuild just it
  } else {
    // a shared include (_preamble.tex, …) changed → rebuild every figure
    console.log(`\n↻ ${filename} changed — rebuilding all figures`);
    for (const fig of figuresOf()) schedule(fig);
  }
});
