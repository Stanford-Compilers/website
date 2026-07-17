---
name: 'TACO: The Tensor Algebra Compiler'
shortName: TACO
summary: A compiler that generates fast kernels for tensor algebra expressions over dense and sparse tensors from a high-level index notation.
category: sparse-compilation
status: Open source under the MIT license. The repository and the online code generator remain available.
problem: Hand-writing sparse tensor kernels is tedious and error-prone, and every new expression, format, or target needs its own implementation.
idea: Separate what is computed (an index-notation expression) from how tensors are stored (a format), then generate a specialized kernel for any combination of the two.
links:
  repo: https://github.com/tensor-compiler/taco
  site: https://tensor-compiler.org
  docs: https://tensor-compiler.org/docs/
  paper: https://doi.org/10.1145/3133901
people:
  - fredrik-kjolstad
relatedProjects:
  - mosaic
  - distal
  - sam
  - burrito
publications:
  - oopsla17
  - oopsla18
  - oopsla20
  - cgo19
  - pldi20
  - pldi24
  - ase17
tags:
  - C++
  - C
  - CUDA
featured: false
order: 1
---

TACO is the foundation of much of the group's work on representation-polymorphic
computation. Its central abstraction — describing computation as index notation
and storage as a composable format — is what lets a single expression be compiled
to code for many different data structures. Later projects extend the same idea to
new domains and machines: distributing it across clusters ([DISTAL](/software/distal)),
mapping it to dataflow accelerators ([the Sparse Abstract Machine](/software/sam)),
binding subexpressions to external libraries ([Mosaic](/software/mosaic)), and adding
shape operators on sparse arrays ([Burrito](/software/burrito)).
