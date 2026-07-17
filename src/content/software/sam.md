---
name: 'SAM: The Sparse Abstract Machine'
shortName: SAM
summary: A streaming-dataflow abstract machine and intermediate representation for compiling sparse tensor algebra to reconfigurable and fixed-function dataflow accelerators.
category: accelerators
status: Open source under the MIT license, including a cycle-tracking simulator.
problem: Sparse tensor accelerators are hard to program and to design, because there is no shared abstraction between the algebra a user writes and the dataflow hardware that runs it.
idea: Define an abstract machine of streaming dataflow primitives that serves as a compilation target for sparse tensor algebra and a design vocabulary for the hardware itself.
links:
  repo: https://github.com/weiya711/sam
  paper: https://doi.org/10.1145/3582016.3582051
people:
  - olivia-hsu
  - fredrik-kjolstad
relatedProjects:
  - taco
  - dam
publications:
  - asplos23-sam
  - cgo25stardust
  - ieeemicro24
tags:
  - Python
  - C++
featured: true
order: 7
---

The Sparse Abstract Machine is where the group's compiler work meets
hardware/software co-design. It plays the role that a conventional instruction set
plays for CPUs: a stable interface that lets sparse tensor algebra be compiled to,
and reasoned about across, a family of dataflow accelerators — a line continued by
Stardust and the group's programmable-accelerator work.
