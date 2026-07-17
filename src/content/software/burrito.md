---
name: Burrito
summary: A compiler for a sparse array language that supports shape operators — such as reshaping and concatenating sparse arrays — alongside compute operators, generating fused code over reshaped views.
category: sparse-compilation
status: The OOPSLA 2024 research artifact is available.
problem: Sparse compilers have focused on arithmetic, but real programs also reshape, slice, and concatenate arrays — operations that are awkward and slow when the data is stored in irregular sparse formats.
idea: Treat shape operators as first-class in the compiler, so it can iterate over reshaped views of sparse data structures and fuse them with computation without materializing intermediates.
links:
  repo: https://github.com/rootjalex/burrito-artifact
  site: https://ajroot.pl/oopsla2024burrito.html
  paper: https://doi.org/10.1145/3689752
people:
  - alexander-root
  - fredrik-kjolstad
relatedProjects:
  - taco
publications:
  - oopsla24shapes
tags:
  - C++
  - MLIR
order: 11
---

Burrito widens what a sparse compiler can express. By handling shape operators, not
just arithmetic, it moves the group's compilation model closer to the full range of
operations that array and tensor programs actually use — another step toward
languages that are genuinely polymorphic over data representation.
