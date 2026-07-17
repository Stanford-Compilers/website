---
name: Scorch
summary: A library that adds sparse tensors and JIT-compiled kernels to PyTorch with a compatible API, automating loop ordering, tiling, and format inference for sparse machine-learning workloads.
category: sparse-compilation
status: Open-source research prototype.
problem: Sparse machine-learning models are held back by tooling — frameworks like PyTorch handle dense tensors well, but sparse kernels are slow, manual, and format-specific.
idea: Bring sparse tensor algebra compilation into the machine-learning framework, and choose schedules and formats automatically so sparse operations run efficiently behind a familiar API.
links:
  repo: https://github.com/bobbyyyan/scorch
  paper: https://arxiv.org/abs/2405.16883
people:
  - bobby-yan
  - alexander-root
  - fredrik-kjolstad
relatedProjects:
  - taco
publications:
  - cgo26scorch
tags:
  - Python
  - C++
order: 12
---

Scorch connects the group's sparse compilation research to mainstream
machine-learning practice. By presenting a PyTorch-compatible interface and choosing
sparse schedules automatically, it aims to make sparse and irregular computation
usable by people who are not compiler experts.
