---
name: Looplets
summary: A language for structured coiteration that breaks iteration over structured and sparse arrays into cases the compiler can specialize, implemented in the open-source Finch array compiler.
category: ir-iteration
status: Looplets are implemented in the open-source Finch array compiler (Julia).
problem: Real array data has rich structure — sparsity, runs, symmetry, padding — but most compilers only understand fully dense or fully sparse iteration, leaving performance on the table.
idea: Represent iteration as looplets that describe the structure of an array's index space, and let the compiler split and combine them to generate code specialized to each structure.
links:
  repo: https://github.com/finch-tensor/Finch.jl
  site: https://finch-tensor.org/
  docs: https://finch-tensor.org/Finch.jl/stable/
  paper: https://doi.org/10.1145/3579990.3580020
people:
  - fredrik-kjolstad
relatedProjects:
  - taco
publications:
  - cgo23
  - pldi22-autoscheduling
tags:
  - Julia
order: 9
---

Looplets generalize the group's sparse iteration model to a much wider range of
array structure. The abstraction is realized in Finch, an array compiler that treats
structure — not just sparsity — as a first-class property to compile against,
directly extending the theme of making computation portable across data
representations.
