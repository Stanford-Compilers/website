---
name: 'DAM: The Dataflow Abstract Machine Simulator'
shortName: DAM
summary: A Rust framework for building fast parallel simulators of dataflow systems, modeling computation as contexts that communicate over latency-bearing channels.
category: accelerators
status: Open source under the Apache-2.0 / MIT licenses. Received an ISCA 2024 Distinguished Artifact Award.
problem: Designing dataflow accelerators requires simulating them, but accurate simulators are slow and building a new one for each architecture is expensive.
idea: Provide a reusable, high-performance simulation framework in which a system is described as communicating contexts and channels with explicit latencies, so many dataflow designs can be modeled and evaluated quickly.
links:
  repo: https://github.com/stanford-ppl/DAM-RS
  paper: https://doi.org/10.1109/ISCA59077.2024.00046
people:
  - rubens-lacouture
  - fredrik-kjolstad
relatedProjects:
  - sam
publications:
  - isca24dam
tags:
  - Rust
order: 13
---

DAM supports the group's accelerator research by making dataflow architectures fast
to simulate and evaluate. It complements the [Sparse Abstract Machine](/software/sam):
where SAM defines a dataflow compilation target, DAM provides the machinery to model
and measure how such designs behave.
