---
name: Copy-and-Patch Compilation
shortName: Copy-and-Patch
summary: A technique that generates machine code by copying pre-built binary stencils and patching in constants and addresses, producing baseline code far faster than a traditional compiler backend.
category: meta-compilation
status: The reference implementation (PochiVM) is open source. Most recent commit 2024.
problem: Fast baseline and JIT compilers need to emit code quickly, but building and maintaining a code generator for each instruction set is a large engineering effort.
idea: Precompile a library of binary code stencils ahead of time, then at runtime stitch and patch them together — giving very fast compilation with no runtime dependency on a heavyweight backend like LLVM.
links:
  repo: https://github.com/sillycross/PochiVM
  docs: https://sillycross.github.io/PochiVM/
  paper: https://doi.org/10.1145/3485513
people:
  - haoran-xu
  - fredrik-kjolstad
relatedProjects:
  - deegen
publications:
  - copy-and-patch
tags:
  - C++
  - LLVM
featured: true
order: 3
---

Copy-and-patch shows how a compiler can be _derived_ rather than hand-written: the
slow, general-purpose optimizer (LLVM) is used offline to build stencils, and the
online compiler becomes a fast assembler of those stencils. It underpins
[Deegen](/software/deegen), the group's virtual-machine generator, and connects to
the broader interest in meta-compilation — systems that generate compilers and
runtimes instead of writing them by hand.
