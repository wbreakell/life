# Life

Life is a WebGPU implementation of Conway's Game of Life.

## What is Conway's Game of Life?

Conway's Game of Life is a zero-player game, meaning its evolution is determined by its initial state, requiring no further input. It was devised by the British mathematician John Horton Conway in 1970.

The "game" is played on a two-dimensional grid of square cells, each of which is in one of two possible states: alive or dead. Every cell interacts with its eight neighbors (horizontally, vertically, or diagonally adjacent). At each step in time (called a generation), the following transitions occur:

1. **Underpopulation:** Any live cell with fewer than two live neighbors dies.
2. **Survival:** Any live cell with two or three live neighbors lives on to the next generation.
3. **Overpopulation:** Any live cell with more than three live neighbors dies.
4. **Reproduction:** Any dead cell with exactly three live neighbors becomes a live cell.

The initial pattern constitutes the "seed" of the system. The first generation is created by applying the above rules simultaneously to every cell in the seed—births and deaths occur simultaneously. The rules continue to be applied repeatedly to create further generations.
