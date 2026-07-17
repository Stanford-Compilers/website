---
name: 'Mosaic: An Interoperable Compiler for Tensor Algebra'
shortName: Mosaic
summary: A tensor algebra compiler, built on TACO, that binds parts of an expression to external hand-tuned functions from other libraries and generates the rest, searching for the best mapping.
category: sparse-compilation
status: Open source; built on TACO.
problem: No single compiler produces the best code for every tensor sub-computation — specialized libraries often win — but mixing library calls with generated code by hand is brittle.
idea: Let users register external functions, automatically search for expression fragments that can be bound to them, verify the bindings, and generate code for whatever is left.
links:
  repo: https://github.com/manya-bansal/mosaic
  paper: https://doi.org/10.1145/3591236
people:
  - fredrik-kjolstad
relatedProjects:
  - taco
publications:
  - pldi23-mosaic
tags:
  - C++
order: 10
---

Mosaic addresses a practical form of the portability problem: making a compiler
_interoperate_ with the ecosystem of existing tensor libraries instead of competing
with it. It extends TACO so that the best available implementation — generated or
hand-tuned — can be chosen per sub-expression.
