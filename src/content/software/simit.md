---
name: 'Simit: A Language for Physical Simulation'
shortName: Simit
summary: A programming language that lets a simulation be written simultaneously as a hypergraph of local update functions and as global vectors, matrices, and tensors.
category: dsl
status: Open source. Most recent commit 2019.
problem: Physical simulations are naturally described locally, at the level of vertices and edges, but run efficiently as global linear algebra — and reconciling those two views by hand is difficult.
idea: Give the programmer both views of the same data at once, and compile the local description down to efficient global sparse linear algebra on CPUs and GPUs.
links:
  repo: https://github.com/simit-lang/simit
  site: http://simit-lang.org
  docs: http://simit-lang.org/language
  paper: https://doi.org/10.1145/2866569
people:
  - fredrik-kjolstad
relatedProjects:
  - taco
publications:
  - tog16a
  - tog16b
tags:
  - C++
  - LLVM
  - CUDA
featured: false
order: 12
---

Simit is an early expression of the group's recurring theme: decoupling how a
computation is _described_ from how its data is _represented and executed_. The
hypergraph-and-tensor duality it introduced for simulation foreshadows the later,
more general work on languages over collections of data and compilers that are
polymorphic over data structures.
