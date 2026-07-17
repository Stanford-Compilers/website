---
name: 'Deegen: A JIT-Capable VM Generator'
shortName: Deegen
summary: A meta-compiler that takes a dynamic language's bytecode semantics, written as C++ functions, and generates a high-performance interpreter and a Copy-and-Patch baseline JIT.
category: meta-compilation
status: Developed within the LuaJIT Remake project. The describing paper is to appear at OOPSLA 2026.
problem: Building a fast virtual machine for a dynamic language means writing an interpreter and one or more JIT tiers by hand, and repeating that effort for every language.
idea: Specify only the bytecode semantics; let a meta-compiler generate the interpreter and a Copy-and-Patch baseline JIT automatically, producing a competitive two-tier execution engine.
links:
  repo: https://github.com/luajit-remake/luajit-remake
  paper: https://doi.org/10.1145/3798246
people:
  - haoran-xu
  - fredrik-kjolstad
relatedProjects:
  - copy-and-patch
publications:
  - oopsla26deegen
tags:
  - C++
  - LLVM
featured: true
order: 4
---

Deegen is the group's most complete example of a _compiler-generating compiler_.
Where TACO generates kernels for one domain (tensor algebra), Deegen generates an
entire execution engine — interpreter plus JIT — from a semantic description. It
builds directly on [Copy-and-Patch](/software/copy-and-patch) for its fast baseline
tier and is validated by reconstructing a competitive Lua virtual machine.
