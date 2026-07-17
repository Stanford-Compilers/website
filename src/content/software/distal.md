---
name: 'DISTAL: The Distributed Tensor Algebra Compiler'
shortName: DISTAL
summary: A compiler for distributed dense tensor algebra that lets users specify how data is distributed and how computation is distributed independently, then compiles to a task-based runtime.
category: distributed
status: Research prototype built as a branch of TACO on top of the Legion runtime. SpDISTAL extends it to sparse tensors.
problem: Running tensor computations across a cluster requires choosing both a data distribution and a computation distribution, and getting good performance usually means entangling those decisions with the kernel.
idea: Express data distribution and computation distribution as separate, composable schedules over a machine model, and compile the combination to distributed tasks on the Legion runtime.
links:
  repo: https://github.com/rohany/taco/tree/DISTAL
  paper: https://doi.org/10.1145/3519939.3523437
people:
  - rohan-yadav
  - fredrik-kjolstad
relatedProjects:
  - taco
  - legate-sparse
publications:
  - pldi22-distal
  - sc22-spdistal
tags:
  - C++
  - Legion
featured: true
order: 5
---

DISTAL carries the TACO philosophy — separate concerns, then schedule them — into
the distributed setting, adding _machines_ as an explicit axis alongside data
representation. SpDISTAL extends the approach to sparse tensors, and the ideas
continue in the group's work on task-based runtimes and
[Legate Sparse](/software/legate-sparse).
