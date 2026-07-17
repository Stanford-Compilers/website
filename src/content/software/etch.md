---
name: 'Etch: Indexed Streams'
shortName: Etch
summary: A Lean 4 compiler and formalization of indexed streams — an operational intermediate representation for the fused execution of contraction programs across sparse tensor and relational algebra.
category: ir-iteration
status: Open-source Lean 4 formalization and compiler.
problem: Sparse tensor algebra and relational algebra share the same underlying pattern — fused iteration over contractions — but are usually compiled by separate, informally specified systems.
idea: Capture that shared pattern as *indexed streams*, a small operational IR with a formal semantics, so a single verified compiler can fuse and execute both tensor and relational contractions.
links:
  repo: https://github.com/kovach/etch
  paper: https://doi.org/10.1145/3591268
people:
  - scott-kovach
  - fredrik-kjolstad
relatedProjects:
  - taco
publications:
  - pldi23-etch
tags:
  - Lean 4
order: 8
---

Indexed streams give the group a _formal_ account of the iteration model that
underlies sparse compilation. By formalizing it in Lean 4 and showing it spans both
tensor and relational algebra, Etch strengthens the claim that a single compiler
abstraction can serve computations that are usually treated as unrelated.
