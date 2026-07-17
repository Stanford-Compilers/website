---
name: 'RECUMA: The Recurrence Computation Machine'
shortName: RECUMA
summary: A compiler that lowers user-specified systems of recurrence equations, with data-structure and scheduling directives, into imperative C loops over dense and sparse arrays.
category: sparse-compilation
status: The evaluation artifact is archived on Zenodo. No public source-code repository was located; see the content review notes.
problem: Many algorithms are naturally written as recurrences — each value defined in terms of earlier ones — but turning a system of recurrences into efficient loop code over the right data structures is done by hand.
idea: Let the programmer state the recurrences plus how data is stored and scheduled, and have the compiler generate loop nests over dense and sparse arrays automatically.
links:
  paper: https://doi.org/10.1145/3649820
people:
  - shiv-sundram
  - fredrik-kjolstad
relatedProjects:
  - taco
publications:
  - oopsla24recurrences
  - oopsla25
tags:
  - C
order: 14
---

RECUMA extends the group's compilation model from tensor algebra to recurrences,
another way of describing computation that is independent of how its data is laid
out. The follow-on REPTILE work adds performant tiling of recurrences, continuing the
theme of separating a computation from its representation and its schedule.
