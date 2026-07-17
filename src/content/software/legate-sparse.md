---
name: Legate Sparse
summary: A distributed, accelerated drop-in replacement for the scipy.sparse library that runs unmodified sparse SciPy programs across clusters of CPUs and GPUs.
category: distributed
status: Open source in the NVIDIA Legate ecosystem. Its authors describe it as alpha, supporting a subset of scipy.sparse.
problem: Scientists write sparse computations against familiar single-node libraries like scipy.sparse, but scaling those programs to many GPUs normally requires rewriting them.
idea: Implement the scipy.sparse interface on top of the Legate/Legion runtime so existing programs distribute automatically, without changes to the user's code.
links:
  repo: https://github.com/nv-legate/legate-sparse
  docs: https://nv-legate.github.io/legate-sparse/
  paper: https://doi.org/10.1145/3581784.3607033
people:
  - rohan-yadav
  - fredrik-kjolstad
relatedProjects:
  - distal
publications:
  - sc23-legate-sparse
tags:
  - Python
  - Legate
  - CUDA
featured: true
order: 6
---

Legate Sparse applies the group's distributed-computation research to a practical
interface many scientists already use. By preserving the scipy.sparse API and moving
the distribution into the runtime, it shows how portability across machines can be
delivered without asking users to change how they write their programs.
