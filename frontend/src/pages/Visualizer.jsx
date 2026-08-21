import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Columns, Grid as GridIcon, Hash, Sparkles, HelpCircle } from 'lucide-react';

// ============================================================================
// SORTING GENERATOR UTILITIES
// ============================================================================

function* bubbleSortGen(arr) {
  const a = [...arr];
  const n = a.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { type: 'compare', indices: [j, j + 1], arr: [...a], sortedBoundary: n - i };
      if (a[j] > a[j + 1]) {
        const temp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = temp;
        yield { type: 'swap', indices: [j, j + 1], arr: [...a], sortedBoundary: n - i };
      }
    }
  }
}

function* quickSortGen(arr, pivotStrategy = 'last', customPivotVal = null) {
  const a = [...arr];
  yield* _quickSort(a, 0, a.length - 1, pivotStrategy, customPivotVal);
}

function* _quickSort(arr, low, high, pivotStrategy, customPivotVal) {
  if (low < high) {
    const pIdx = yield* _partition(arr, low, high, pivotStrategy, customPivotVal);
    yield* _quickSort(arr, low, pIdx - 1, pivotStrategy, customPivotVal);
    yield* _quickSort(arr, pIdx + 1, high, pivotStrategy, customPivotVal);
  }
}

function* _partition(arr, low, high, pivotStrategy, customPivotVal) {
  let pivotIdx = high;
  if (pivotStrategy === 'first') {
    pivotIdx = low;
  } else if (pivotStrategy === 'middle') {
    pivotIdx = Math.floor((low + high) / 2);
  } else if (pivotStrategy === 'random') {
    pivotIdx = low + Math.floor(Math.random() * (high - low + 1));
  } else if (pivotStrategy === 'custom' && customPivotVal !== null) {
    let foundIdx = -1;
    for (let k = low; k <= high; k++) {
      if (arr[k] === customPivotVal) {
        foundIdx = k;
        break;
      }
    }
    if (foundIdx !== -1) {
      pivotIdx = foundIdx;
    }
  }

  if (pivotIdx !== high) {
    const temp = arr[pivotIdx];
    arr[pivotIdx] = arr[high];
    arr[high] = temp;
    yield { type: 'swap', indices: [pivotIdx, high], arr: [...arr], pivotIdx: high };
  }

  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    yield { type: 'compare', indices: [j, high], arr: [...arr], pivotIdx: high };
    if (arr[j] < pivot) {
      i++;
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
      yield { type: 'swap', indices: [i, j], arr: [...arr], pivotIdx: high };
    }
  }
  const temp = arr[i + 1];
  arr[i + 1] = arr[high];
  arr[high] = temp;
  yield { type: 'swap', indices: [i + 1, high], arr: [...arr], pivotIdx: i + 1 };
  return i + 1;
}

function* selectionSortGen(arr) {
  const a = [...arr];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { type: 'compare', indices: [j, minIdx], arr: [...a], minIdx: minIdx, sortedBoundary: i };
      if (a[j] < a[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      const temp = a[i];
      a[i] = a[minIdx];
      a[minIdx] = temp;
      yield { type: 'swap', indices: [i, minIdx], arr: [...a], minIdx: minIdx, sortedBoundary: i };
    }
  }
}

function* insertionSortGen(arr) {
  const a = [...arr];
  const n = a.length;
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0) {
      yield { type: 'compare', indices: [j, j + 1], arr: [...a], keyIdx: j + 1, sortedBoundary: i };
      if (a[j] > key) {
        a[j + 1] = a[j];
        yield { type: 'swap', indices: [j, j + 1], arr: [...a], keyIdx: j, sortedBoundary: i };
        j--;
      } else {
        break;
      }
    }
    a[j + 1] = key;
    yield { type: 'swap', indices: [j + 1], arr: [...a], keyIdx: j + 1, sortedBoundary: i };
  }
}

function* mergeSortGen(arr) {
  const a = [...arr];
  yield* _mergeSortGenHelper(a, 0, a.length - 1);
}

function* _mergeSortGenHelper(arr, l, r) {
  if (l < r) {
    const m = Math.floor((l + r) / 2);
    yield* _mergeSortGenHelper(arr, l, m);
    yield* _mergeSortGenHelper(arr, m + 1, r);
    yield* _mergeGenHelper(arr, l, m, r);
  }
}

function* _mergeGenHelper(arr, l, m, r) {
  const left = arr.slice(l, m + 1);
  const right = arr.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  
  while (i < left.length && j < right.length) {
    yield { type: 'compare', indices: [l + i, m + 1 + j], arr: [...arr], mergeRange: [l, r], mergeActiveIdx: k };
    if (left[i] <= right[j]) {
      arr[k] = left[i];
      i++;
    } else {
      arr[k] = right[j];
      j++;
    }
    yield { type: 'swap', indices: [k], arr: [...arr], mergeRange: [l, r], mergeActiveIdx: k };
    k++;
  }
  
  while (i < left.length) {
    arr[k] = left[i];
    yield { type: 'swap', indices: [k], arr: [...arr], mergeRange: [l, r], mergeActiveIdx: k };
    i++;
    k++;
  }
  
  while (j < right.length) {
    arr[k] = right[j];
    yield { type: 'swap', indices: [k], arr: [...arr], mergeRange: [l, r], mergeActiveIdx: k };
    j++;
    k++;
  }
}

function* heapSortGen(arr) {
  const a = [...arr];
  const n = a.length;

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* _heapifyGenHelper(a, n, i);
  }

  for (let i = n - 1; i > 0; i--) {
    const temp = a[0];
    a[0] = a[i];
    a[i] = temp;
    yield { type: 'swap', indices: [0, i], arr: [...a], heapRootIdx: 0, sortedBoundary: i };
    yield* _heapifyGenHelper(a, i, 0);
  }
}

function* _heapifyGenHelper(arr, size, idx) {
  let largest = idx;
  const left = 2 * idx + 1;
  const right = 2 * idx + 2;

  if (left < size) {
    yield { type: 'compare', indices: [left, largest], arr: [...arr], heapRootIdx: idx, sortedBoundary: size };
    if (arr[left] > arr[largest]) {
      largest = left;
    }
  }

  if (right < size) {
    yield { type: 'compare', indices: [right, largest], arr: [...arr], heapRootIdx: idx, sortedBoundary: size };
    if (arr[right] > arr[largest]) {
      largest = right;
    }
  }

  if (largest !== idx) {
    const temp = arr[idx];
    arr[idx] = arr[largest];
    arr[largest] = temp;
    yield { type: 'swap', indices: [idx, largest], arr: [...arr], heapRootIdx: idx, sortedBoundary: size };
    yield* _heapifyGenHelper(arr, size, largest);
  }
}

// ============================================================================
// N-QUEENS BACKTRACKING GENERATOR UTILITY
// ============================================================================

function* solveNQueensGen(n, board, row = 0) {
  if (row === n) {
    yield { board: [...board], status: 'solved', activeRow: -1, activeCol: -1, conflict: false };
    return true;
  }
  for (let col = 0; col < n; col++) {
    board[row] = col;
    yield { board: [...board], status: 'trying', activeRow: row, activeCol: col, conflict: false };
    
    // Check conflicts
    let conflict = false;
    for (let i = 0; i < row; i++) {
      if (board[i] === col || board[i] - i === col - row || board[i] + i === col + row) {
        conflict = true;
        break;
      }
    }
    if (conflict) {
      yield { board: [...board], status: 'conflict', activeRow: row, activeCol: col, conflict: true };
      board[row] = -1;
      continue;
    }
    
    const solved = yield* solveNQueensGen(n, board, row + 1);
    if (solved) return true;
    board[row] = -1;
    yield { board: [...board], status: 'backtracking', activeRow: row, activeCol: col, conflict: false };
  }
  return false;
}

// ============================================================================
// STRING MATCHING GENERATOR UTILITIES
// ============================================================================

function* naiveSearchGen(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  const matches = [];
  let totalComparisons = 0;
  let totalShifts = 0;
  
  for (let i = 0; i <= n - m; i++) {
    let match = true;
    for (let j = 0; j < m; j++) {
      totalComparisons++;
      yield {
        shift: i,
        charIdx: j,
        status: 'comparing',
        compareResult: text[i + j] === pattern[j] ? 'match' : 'mismatch',
        matches: [...matches],
        comparedIndices: [i + j],
        patternIndices: [j],
        totalComparisons,
        totalShifts
      };
      if (text[i + j] !== pattern[j]) {
        match = false;
        totalShifts++;
        yield {
          shift: i,
          charIdx: j,
          status: 'mismatch',
          matches: [...matches],
          comparedIndices: [i + j],
          patternIndices: [j],
          explanation: `Mismatch at text index ${i + j} ('${text[i + j]}') and pattern index ${j} ('${pattern[j]}'). Shifting pattern by 1.`,
          totalComparisons,
          totalShifts
        };
        break;
      }
    }
    if (match) {
      matches.push(i);
      totalShifts++;
      yield {
        shift: i,
        charIdx: m - 1,
        status: 'found',
        matches: [...matches],
        comparedIndices: Array.from({length: m}, (_, idx) => i + idx),
        patternIndices: Array.from({length: m}, (_, idx) => idx),
        explanation: `Full match found at shift index ${i}! Shifting pattern by 1.`,
        totalComparisons,
        totalShifts
      };
    }
  }
  yield {
    shift: n - m,
    charIdx: -1,
    status: 'complete',
    matches: [...matches],
    comparedIndices: [],
    patternIndices: [],
    explanation: `Search complete. Found matches at shift indices: ${matches.join(', ') || 'None'}`,
    totalComparisons,
    totalShifts
  };
}

function* horspoolSearchGen(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  const matches = [];
  let totalComparisons = 0;
  let totalShifts = 0;
  
  const shiftTable = {};
  for (let i = 0; i < m - 1; i++) {
    shiftTable[pattern[i]] = m - 1 - i;
  }
  
  let i = 0;
  while (i <= n - m) {
    let j = m - 1;
    let match = true;
    while (j >= 0) {
      totalComparisons++;
      yield {
        shift: i,
        charIdx: j,
        status: 'comparing',
        compareResult: text[i + j] === pattern[j] ? 'match' : 'mismatch',
        matches: [...matches],
        comparedIndices: [i + j],
        patternIndices: [j],
        totalComparisons,
        totalShifts
      };
      
      if (text[i + j] !== pattern[j]) {
        match = false;
        const char = text[i + m - 1];
        const shiftVal = shiftTable[char] !== undefined ? shiftTable[char] : m;
        totalShifts++;
        yield {
          shift: i,
          charIdx: j,
          status: 'mismatch',
          matches: [...matches],
          comparedIndices: [i + j],
          patternIndices: [j],
          explanation: `Mismatch at text index ${i + j} ('${text[i + j]}') and pattern index ${j} ('${pattern[j]}'). Aligning rightmost character '${text[i + m - 1]}' gives shift size of ${shiftVal}.`,
          totalComparisons,
          totalShifts
        };
        i += shiftVal;
        break;
      }
      j--;
    }
    if (match) {
      matches.push(i);
      const char = text[i + m - 1];
      const shiftVal = shiftTable[char] !== undefined ? shiftTable[char] : m;
      totalShifts++;
      yield {
        shift: i,
        charIdx: 0,
        status: 'found',
        matches: [...matches],
        comparedIndices: Array.from({length: m}, (_, idx) => i + idx),
        patternIndices: Array.from({length: m}, (_, idx) => idx),
        explanation: `Full match found at shift index ${i}! Aligning rightmost character '${text[i + m - 1]}' gives shift size of ${shiftVal}.`,
        totalComparisons,
        totalShifts
      };
      i += shiftVal;
    }
  }
  yield {
    shift: i > n - m ? n - m : i,
    charIdx: -1,
    status: 'complete',
    matches: [...matches],
    comparedIndices: [],
    patternIndices: [],
    explanation: `Search complete. Found matches at shift indices: ${matches.join(', ') || 'None'}`,
    totalComparisons,
    totalShifts
  };
}

function* boyerMooreSearchGen(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  const matches = [];
  let totalComparisons = 0;
  let totalShifts = 0;
  
  const badChar = {};
  for (let i = 0; i < m; i++) {
    badChar[pattern[i]] = i;
  }
  
  const f = Array(m + 1).fill(0);
  const s = Array(m + 1).fill(0);
  let i_gs = m;
  let j_gs = m + 1;
  f[i_gs] = j_gs;
  while (i_gs > 0) {
    while (j_gs <= m && pattern[i_gs - 1] !== pattern[j_gs - 1]) {
      if (s[j_gs] === 0) s[j_gs] = j_gs - i_gs;
      j_gs = f[j_gs];
    }
    i_gs--;
    j_gs--;
    f[i_gs] = j_gs;
  }
  let j_gs2 = f[0];
  for (let i = 0; i <= m; i++) {
    if (s[i] === 0) s[i] = j_gs2;
    if (i === j_gs2) j_gs2 = f[j_gs2];
  }
  const goodSuffix = Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    goodSuffix[i] = s[i + 1];
  }
  
  let shift = 0;
  while (shift <= n - m) {
    let j = m - 1;
    let match = true;
    while (j >= 0) {
      totalComparisons++;
      yield {
        shift: shift,
        charIdx: j,
        status: 'comparing',
        compareResult: text[shift + j] === pattern[j] ? 'match' : 'mismatch',
        matches: [...matches],
        comparedIndices: [shift + j],
        patternIndices: [j],
        totalComparisons,
        totalShifts
      };
      
      if (text[shift + j] !== pattern[j]) {
        match = false;
        const char = text[shift + j];
        const bcShift = Math.max(1, j - (badChar[char] !== undefined ? badChar[char] : -1));
        const gsShift = goodSuffix[j];
        const shiftVal = Math.max(bcShift, gsShift);
        totalShifts++;
        yield {
          shift: shift,
          charIdx: j,
          status: 'mismatch',
          matches: [...matches],
          comparedIndices: [shift + j],
          patternIndices: [j],
          explanation: `Mismatch at text index ${shift + j} ('${text[shift + j]}') and pattern index ${j} ('${pattern[j]}'). Bad Character Heuristic shift: ${bcShift}. Good Suffix Heuristic shift: ${gsShift}. Shifting pattern by max(${bcShift}, ${gsShift}) = ${shiftVal}.`,
          totalComparisons,
          totalShifts
        };
        shift += shiftVal;
        break;
      }
      j--;
    }
    if (match) {
      matches.push(shift);
      totalShifts++;
      yield {
        shift: shift,
        charIdx: 0,
        status: 'found',
        matches: [...matches],
        comparedIndices: Array.from({length: m}, (_, idx) => shift + idx),
        patternIndices: Array.from({length: m}, (_, idx) => idx),
        explanation: `Full match found at shift index ${shift}! Shifting pattern by good suffix default: ${s[0]}.`,
        totalComparisons,
        totalShifts
      };
      shift += s[0];
    }
  }
  yield {
    shift: shift > n - m ? n - m : shift,
    charIdx: -1,
    status: 'complete',
    matches: [...matches],
    comparedIndices: [],
    patternIndices: [],
    explanation: `Search complete. Found matches at shift indices: ${matches.join(', ') || 'None'}`,
    totalComparisons,
    totalShifts
  };
}

// Helper functions for preprocessing tables
const getHorspoolTable = (pat) => {
  const m = pat.length;
  const table = {};
  for (let i = 0; i < m - 1; i++) {
    table[pat[i]] = m - 1 - i;
  }
  return table;
};

const getBoyerMooreBadCharTable = (pat) => {
  const m = pat.length;
  const table = {};
  for (let i = 0; i < m; i++) {
    table[pat[i]] = i;
  }
  return table;
};

const getBoyerMooreGoodSuffixTable = (pat) => {
  const m = pat.length;
  const f = Array(m + 1).fill(0);
  const s = Array(m + 1).fill(0);
  let i = m;
  let j = m + 1;
  f[i] = j;
  while (i > 0) {
    while (j <= m && pat[i - 1] !== pat[j - 1]) {
      if (s[j] === 0) s[j] = j - i;
      j = f[j];
    }
    i--;
    j--;
    f[i] = j;
  }
  let j2 = f[0];
  for (let i = 0; i <= m; i++) {
    if (s[i] === 0) s[i] = j2;
    if (i === j2) j2 = f[j2];
  }
  const goodSuffix = Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    goodSuffix[i] = s[i + 1];
  }
  return goodSuffix;
};

// ============================================================================
// GRAPH SIMULATION UTILITIES
// ============================================================================

const GRAPH_PRESETS = [
  {
    name: "Symmetric Ring",
    nodes: [
      { id: 0, label: 'A', x: 80, y: 70 },
      { id: 1, label: 'B', x: 220, y: 50 },
      { id: 2, label: 'C', x: 360, y: 90 },
      { id: 3, label: 'D', x: 80, y: 220 },
      { id: 4, label: 'E', x: 220, y: 250 },
      { id: 5, label: 'F', x: 360, y: 200 },
    ],
    edges: [
      { from: 0, to: 1, weight: 4 },
      { from: 0, to: 3, weight: 2 },
      { from: 1, to: 2, weight: 3 },
      { from: 1, to: 4, weight: 1 },
      { from: 2, to: 5, weight: 2 },
      { from: 3, to: 4, weight: 5 },
      { from: 4, to: 5, weight: 4 },
    ],
    adjList: {
      0: [{ to: 1, weight: 4 }, { to: 3, weight: 2 }],
      1: [{ to: 0, weight: 4 }, { to: 2, weight: 3 }, { to: 4, weight: 1 }],
      2: [{ to: 1, weight: 3 }, { to: 5, weight: 2 }],
      3: [{ to: 0, weight: 2 }, { to: 4, weight: 5 }],
      4: [{ to: 1, weight: 1 }, { to: 3, weight: 5 }, { to: 5, weight: 4 }],
      5: [{ to: 2, weight: 2 }, { to: 4, weight: 4 }],
    }
  },
  {
    name: "Binary Tree",
    nodes: [
      { id: 0, label: 'A', x: 220, y: 50 },
      { id: 1, label: 'B', x: 120, y: 130 },
      { id: 2, label: 'C', x: 320, y: 130 },
      { id: 3, label: 'D', x: 70, y: 230 },
      { id: 4, label: 'E', x: 170, y: 230 },
      { id: 5, label: 'F', x: 270, y: 230 },
    ],
    edges: [
      { from: 0, to: 1, weight: 2 },
      { from: 0, to: 2, weight: 5 },
      { from: 1, to: 3, weight: 4 },
      { from: 1, to: 4, weight: 3 },
      { from: 2, to: 5, weight: 1 },
      { from: 3, to: 4, weight: 2 },
      { from: 4, to: 5, weight: 6 },
    ],
    adjList: {
      0: [{ to: 1, weight: 2 }, { to: 2, weight: 5 }],
      1: [{ to: 0, weight: 2 }, { to: 3, weight: 4 }, { to: 4, weight: 3 }],
      2: [{ to: 0, weight: 5 }, { to: 5, weight: 1 }],
      3: [{ to: 1, weight: 4 }, { to: 4, weight: 2 }],
      4: [{ to: 1, weight: 3 }, { to: 3, weight: 2 }, { to: 5, weight: 6 }],
      5: [{ to: 2, weight: 1 }, { to: 4, weight: 6 }],
    }
  },
  {
    name: "Mesh Network",
    nodes: [
      { id: 0, label: 'A', x: 220, y: 150 },
      { id: 1, label: 'B', x: 70, y: 60 },
      { id: 2, label: 'C', x: 370, y: 60 },
      { id: 3, label: 'D', x: 70, y: 240 },
      { id: 4, label: 'E', x: 370, y: 240 },
      { id: 5, label: 'F', x: 220, y: 250 },
    ],
    edges: [
      { from: 0, to: 1, weight: 3 },
      { from: 0, to: 2, weight: 2 },
      { from: 0, to: 3, weight: 4 },
      { from: 0, to: 4, weight: 1 },
      { from: 1, to: 2, weight: 6 },
      { from: 2, to: 4, weight: 5 },
      { from: 3, to: 5, weight: 3 },
      { from: 4, to: 5, weight: 2 },
    ],
    adjList: {
      0: [{ to: 1, weight: 3 }, { to: 2, weight: 2 }, { to: 3, weight: 4 }, { to: 4, weight: 1 }],
      1: [{ to: 0, weight: 3 }, { to: 2, weight: 6 }],
      2: [{ to: 0, weight: 2 }, { to: 1, weight: 6 }, { to: 4, weight: 5 }],
      3: [{ to: 0, weight: 4 }, { to: 5, weight: 3 }],
      4: [{ to: 0, weight: 1 }, { to: 2, weight: 5 }, { to: 5, weight: 2 }],
      5: [{ to: 3, weight: 3 }, { to: 4, weight: 2 }],
    }
  },
  {
    name: "Wheel Graph",
    nodes: [
      { id: 0, label: 'A', x: 220, y: 160 },
      { id: 1, label: 'B', x: 310, y: 160 },
      { id: 2, label: 'C', x: 265, y: 238 },
      { id: 3, label: 'D', x: 175, y: 238 },
      { id: 4, label: 'E', x: 130, y: 160 },
      { id: 5, label: 'F', x: 175, y: 82 },
      { id: 6, label: 'G', x: 265, y: 82 },
    ],
    edges: [
      { from: 0, to: 1, weight: 2 },
      { from: 0, to: 2, weight: 3 },
      { from: 0, to: 3, weight: 2 },
      { from: 0, to: 4, weight: 4 },
      { from: 0, to: 5, weight: 1 },
      { from: 0, to: 6, weight: 3 },
      { from: 1, to: 2, weight: 3 },
      { from: 2, to: 3, weight: 2 },
      { from: 3, to: 4, weight: 4 },
      { from: 4, to: 5, weight: 3 },
      { from: 5, to: 6, weight: 2 },
      { from: 6, to: 1, weight: 5 },
    ],
    adjList: {
      0: [{ to: 1, weight: 2 }, { to: 2, weight: 3 }, { to: 3, weight: 2 }, { to: 4, weight: 4 }, { to: 5, weight: 1 }, { to: 6, weight: 3 }],
      1: [{ to: 0, weight: 2 }, { to: 2, weight: 3 }, { to: 6, weight: 5 }],
      2: [{ to: 0, weight: 3 }, { to: 1, weight: 3 }, { to: 3, weight: 2 }],
      3: [{ to: 0, weight: 2 }, { to: 2, weight: 2 }, { to: 4, weight: 4 }],
      4: [{ to: 0, weight: 4 }, { to: 3, weight: 4 }, { to: 5, weight: 3 }],
      5: [{ to: 0, weight: 1 }, { to: 4, weight: 3 }, { to: 6, weight: 2 }],
      6: [{ to: 0, weight: 3 }, { to: 5, weight: 2 }, { to: 1, weight: 5 }],
    }
  },
  {
    name: "Bridge Connector",
    nodes: [
      { id: 0, label: 'A', x: 80, y: 90 },
      { id: 1, label: 'B', x: 160, y: 90 },
      { id: 2, label: 'C', x: 80, y: 210 },
      { id: 3, label: 'D', x: 160, y: 210 },
      { id: 4, label: 'E', x: 280, y: 90 },
      { id: 5, label: 'F', x: 360, y: 90 },
      { id: 6, label: 'G', x: 280, y: 210 },
      { id: 7, label: 'H', x: 360, y: 210 },
    ],
    edges: [
      { from: 0, to: 1, weight: 1 },
      { from: 0, to: 2, weight: 3 },
      { from: 1, to: 3, weight: 5 },
      { from: 2, to: 3, weight: 2 },
      { from: 1, to: 4, weight: 2 },
      { from: 3, to: 6, weight: 4 },
      { from: 4, to: 5, weight: 2 },
      { from: 4, to: 6, weight: 1 },
      { from: 5, to: 7, weight: 4 },
      { from: 6, to: 7, weight: 3 },
    ],
    adjList: {
      0: [{ to: 1, weight: 1 }, { to: 2, weight: 3 }],
      1: [{ to: 0, weight: 1 }, { to: 3, weight: 5 }, { to: 4, weight: 2 }],
      2: [{ to: 0, weight: 3 }, { to: 3, weight: 2 }],
      3: [{ to: 1, weight: 5 }, { to: 2, weight: 2 }, { to: 6, weight: 4 }],
      4: [{ to: 1, weight: 2 }, { to: 5, weight: 2 }, { to: 6, weight: 1 }],
      5: [{ to: 4, weight: 2 }, { to: 7, weight: 4 }],
      6: [{ to: 3, weight: 4 }, { to: 4, weight: 1 }, { to: 7, weight: 3 }],
      7: [{ to: 5, weight: 4 }, { to: 6, weight: 3 }],
    }
  },
  {
    name: "Symmetric Octagon",
    nodes: [
      { id: 0, label: 'A', x: 320, y: 160 },
      { id: 1, label: 'B', x: 291, y: 231 },
      { id: 2, label: 'C', x: 220, y: 260 },
      { id: 3, label: 'D', x: 149, y: 231 },
      { id: 4, label: 'E', x: 120, y: 160 },
      { id: 5, label: 'F', x: 149, y: 89 },
      { id: 6, label: 'G', x: 220, y: 60 },
      { id: 7, label: 'H', x: 291, y: 89 },
    ],
    edges: [
      { from: 0, to: 1, weight: 2 },
      { from: 1, to: 2, weight: 3 },
      { from: 2, to: 3, weight: 2 },
      { from: 3, to: 4, weight: 4 },
      { from: 4, to: 5, weight: 2 },
      { from: 5, to: 6, weight: 3 },
      { from: 6, to: 7, weight: 1 },
      { from: 7, to: 0, weight: 5 },
      { from: 0, to: 4, weight: 6 },
      { from: 2, to: 6, weight: 5 },
      { from: 1, to: 5, weight: 4 },
      { from: 3, to: 7, weight: 3 },
    ],
    adjList: {
      0: [{ to: 1, weight: 2 }, { to: 7, weight: 5 }, { to: 4, weight: 6 }],
      1: [{ to: 0, weight: 2 }, { to: 2, weight: 3 }, { to: 5, weight: 4 }],
      2: [{ to: 1, weight: 3 }, { to: 3, weight: 2 }, { to: 6, weight: 5 }],
      3: [{ to: 2, weight: 2 }, { to: 4, weight: 4 }, { to: 7, weight: 3 }],
      4: [{ to: 3, weight: 4 }, { to: 5, weight: 2 }, { to: 0, weight: 6 }],
      5: [{ to: 4, weight: 2 }, { to: 6, weight: 3 }, { to: 1, weight: 4 }],
      6: [{ to: 5, weight: 3 }, { to: 7, weight: 1 }, { to: 2, weight: 5 }],
      7: [{ to: 6, weight: 1 }, { to: 0, weight: 5 }, { to: 3, weight: 3 }],
    }
  }
];

function* bfsGraphGen(nodes, startNodeId, targetNodeId, adj) {
  const visited = new Set();
  const queue = [[startNodeId, []]]; // [nodeId, path_of_edges]
  visited.add(startNodeId);
  
  yield { visitedNodes: [startNodeId], activeNode: startNodeId, activeEdge: null, pathEdges: [], status: 'visiting' };
  
  while (queue.length > 0) {
    const [u, path] = queue.shift();
    yield { visitedNodes: Array.from(visited), activeNode: u, activeEdge: null, pathEdges: path, status: 'visiting' };
    
    if (u === targetNodeId) {
      yield { visitedNodes: Array.from(visited), activeNode: u, activeEdge: null, pathEdges: path, status: 'found' };
      return;
    }
    
    const neighbors = adj[u] || [];
    for (const neighbor of neighbors) {
      const v = neighbor.to;
      const edgeKey = `${Math.min(u, v)}-${Math.max(u, v)}`;
      
      if (!visited.has(v)) {
        visited.add(v);
        const newPath = [...path, edgeKey];
        yield { 
          visitedNodes: Array.from(visited), 
          activeNode: v, 
          activeEdge: edgeKey, 
          pathEdges: path, 
          status: 'exploring' 
        };
        queue.push([v, newPath]);
      }
    }
  }
}

function* dfsGraphGen(nodes, startNodeId, targetNodeId, adj) {
  const visited = new Set();
  yield* _dfsGraphGenHelper(startNodeId, targetNodeId, visited, [], adj);
}

function* _dfsGraphGenHelper(u, targetNodeId, visited, path, adj) {
  visited.add(u);
  yield { visitedNodes: Array.from(visited), activeNode: u, activeEdge: null, pathEdges: path, status: 'visiting' };
  
  if (u === targetNodeId) {
    yield { visitedNodes: Array.from(visited), activeNode: u, activeEdge: null, pathEdges: path, status: 'found' };
    return true;
  }
  
  const neighbors = adj[u] || [];
  for (const neighbor of neighbors) {
    const v = neighbor.to;
    const edgeKey = `${Math.min(u, v)}-${Math.max(u, v)}`;
    if (!visited.has(v)) {
      const newPath = [...path, edgeKey];
      yield { 
        visitedNodes: Array.from(visited), 
        activeNode: v, 
        activeEdge: edgeKey, 
        pathEdges: path, 
        status: 'exploring' 
      };
      
      const found = yield* _dfsGraphGenHelper(v, targetNodeId, visited, newPath, adj);
      if (found) return true;
      
      yield { 
        visitedNodes: Array.from(visited), 
        activeNode: u, 
        activeEdge: edgeKey, 
        pathEdges: path, 
        status: 'backtracking' 
      };
    }
  }
  return false;
}

function* dijkstraGraphGen(nodes, startNodeId, targetNodeId, adj) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const pq = []; 
  
  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });
  
  distances[startNodeId] = 0;
  pq.push({ id: startNodeId, dist: 0 });
  
  yield { 
    visitedNodes: [], 
    distances: { ...distances }, 
    activeNode: startNodeId, 
    activeEdge: null, 
    pathEdges: [], 
    status: 'started' 
  };
  
  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { id: u, dist: d } = pq.shift();
    
    if (visited.has(u)) continue;
    visited.add(u);
    
    const currentPath = [];
    let curr = u;
    while (previous[curr] !== null) {
      const prev = previous[curr];
      currentPath.push(`${Math.min(curr, prev)}-${Math.max(curr, prev)}`);
      curr = prev;
    }
    
    yield { 
      visitedNodes: Array.from(visited), 
      distances: { ...distances }, 
      activeNode: u, 
      activeEdge: null, 
      pathEdges: currentPath, 
      status: 'visiting' 
    };
    
    if (u === targetNodeId) {
      yield { 
        visitedNodes: Array.from(visited), 
        distances: { ...distances }, 
        activeNode: u, 
        activeEdge: null, 
        pathEdges: currentPath, 
        status: 'found' 
      };
      return;
    }
    
    const neighbors = adj[u] || [];
    for (const neighbor of neighbors) {
      const v = neighbor.to;
      const weight = neighbor.weight;
      const edgeKey = `${Math.min(u, v)}-${Math.max(u, v)}`;
      
      if (!visited.has(v)) {
        const alt = distances[u] + weight;
        yield { 
          visitedNodes: Array.from(visited), 
          distances: { ...distances }, 
          activeNode: v, 
          activeEdge: edgeKey, 
          pathEdges: currentPath, 
          status: 'exploring' 
        };
        
        if (alt < distances[v]) {
          distances[v] = alt;
          previous[v] = u;
          pq.push({ id: v, dist: alt });
          
          const updatedPath = [];
          let temp = v;
          while (previous[temp] !== null) {
            const p = previous[temp];
            updatedPath.push(`${Math.min(temp, p)}-${Math.max(temp, p)}`);
            temp = p;
          }
          
          yield { 
            visitedNodes: Array.from(visited), 
            distances: { ...distances }, 
            activeNode: v, 
            activeEdge: edgeKey, 
            pathEdges: updatedPath, 
            status: 'relaxed_edge' 
          };
        }
      }
    }
  }
}

export default function Visualizer() {
  const [activeTab, setActiveTab] = useState('sorting'); // sorting | pathfinding | backtracking

  // ==========================================
  // SORTING STATE & CONTROLS
  // ==========================================
  const [sortArray, setSortArray] = useState([]);
  const [activeIndices, setActiveIndices] = useState([]);
  const [compareType, setCompareType] = useState(''); // compare | swap
  const [sortAlgo, setSortAlgo] = useState('quick'); // quick | bubble
  const [sortSpeed, setSortSpeed] = useState(100); // ms delay
  const [isSorting, setIsSorting] = useState(false);
  const [customSortInput, setCustomSortInput] = useState('');
  const [quickSortPivotStrategy, setQuickSortPivotStrategy] = useState('last');
  const [quickSortCustomPivotVal, setQuickSortCustomPivotVal] = useState('');

  // Custom visual markers state
  const [pivotIndex, setPivotIndex] = useState(-1);
  const [minIndex, setMinIndex] = useState(-1);
  const [keyIndex, setKeyIndex] = useState(-1);
  const [mergeRange, setMergeRange] = useState([]);
  const [mergeActiveIndex, setMergeActiveIndex] = useState(-1);
  const [heapRootIndex, setHeapRootIndex] = useState(-1);
  const [sortedBoundary, setSortedBoundary] = useState(-1);

  const resetMarkers = () => {
    setPivotIndex(-1);
    setMinIndex(-1);
    setKeyIndex(-1);
    setMergeRange([]);
    setMergeActiveIndex(-1);
    setHeapRootIndex(-1);
    setSortedBoundary(-1);
  };

  const sortIteratorRef = useRef(null);
  const sortTimerRef = useRef(null);

  const generateNewArray = () => {
    resetSortTimer();
    const arr = [];
    for (let i = 0; i < 28; i++) {
      arr.push(Math.floor(Math.random() * 200) + 15);
    }
    setSortArray(arr);
    setActiveIndices([]);
    setCompareType('');
    setIsSorting(false);
    resetMarkers();
  };

  useEffect(() => {
    generateNewArray();
    return () => resetSortTimer();
  }, []);

  const resetSortTimer = () => {
    if (sortTimerRef.current) clearInterval(sortTimerRef.current);
    sortTimerRef.current = null;
  };

  const handleStartSort = () => {
    if (isSorting) {
      // Pause
      resetSortTimer();
      setIsSorting(false);
      return;
    }

    setIsSorting(true);
    
    if (!sortIteratorRef.current) {
      let generator;
      switch (sortAlgo) {
        case 'quick':
          const customPivot = quickSortCustomPivotVal !== '' ? parseInt(quickSortCustomPivotVal) : null;
          generator = quickSortGen(sortArray, quickSortPivotStrategy, customPivot);
          break;
        case 'bubble':
          generator = bubbleSortGen(sortArray);
          break;
        case 'selection':
          generator = selectionSortGen(sortArray);
          break;
        case 'insertion':
          generator = insertionSortGen(sortArray);
          break;
        case 'merge':
          generator = mergeSortGen(sortArray);
          break;
        case 'heap':
          generator = heapSortGen(sortArray);
          break;
        default:
          generator = quickSortGen(sortArray);
      }
      sortIteratorRef.current = generator;
    }

    sortTimerRef.current = setInterval(() => {
      const next = sortIteratorRef.current.next();
      if (next.done) {
        resetSortTimer();
        setIsSorting(false);
        setActiveIndices([]);
        setCompareType('');
        sortIteratorRef.current = null;
        resetMarkers();
      } else {
        const { indices, type, arr, pivotIdx, minIdx, keyIdx, mergeRange: mr, mergeActiveIdx, heapRootIdx, sortedBoundary: sb } = next.value;
        setSortArray(arr);
        setActiveIndices(indices);
        setCompareType(type);

        // Update markers
        setPivotIndex(pivotIdx !== undefined ? pivotIdx : -1);
        setMinIndex(minIdx !== undefined ? minIdx : -1);
        setKeyIndex(keyIdx !== undefined ? keyIdx : -1);
        setMergeRange(mr !== undefined ? mr : []);
        setMergeActiveIndex(mergeActiveIdx !== undefined ? mergeActiveIdx : -1);
        setHeapRootIndex(heapRootIdx !== undefined ? heapRootIdx : -1);
        setSortedBoundary(sb !== undefined ? sb : -1);
      }
    }, sortSpeed);
  };

  const handleResetSort = () => {
    generateNewArray();
    sortIteratorRef.current = null;
    resetMarkers();
  };

// ==========================================
// GRAPH SIMULATOR STATE & CONTROLS
// ==========================================
  const [currentGraphIdx, setCurrentGraphIdx] = useState(0);
  const [graphState, setGraphState] = useState(() => JSON.parse(JSON.stringify(GRAPH_PRESETS[0])));
  const [graphStartNode, setGraphStartNode] = useState(0); 
  const [graphTargetNode, setGraphTargetNode] = useState(5); 
  const [graphAlgo, setGraphAlgo] = useState('dijkstra'); // dijkstra | bfs | dfs
  const [graphSpeed, setGraphSpeed] = useState(250); // ms delay
  const [isGraphRunning, setIsGraphRunning] = useState(false);
  
  const [graphVisitedNodes, setGraphVisitedNodes] = useState([]);
  const [graphActiveNode, setGraphActiveNode] = useState(null);
  const [graphActiveEdge, setGraphActiveEdge] = useState(null);
  const [graphPathEdges, setGraphPathEdges] = useState([]);
  const [graphStatusText, setGraphStatusText] = useState('idle');
  const [graphDistances, setGraphDistances] = useState({});

  const graphIteratorRef = useRef(null);
  const graphTimerRef = useRef(null);

  const graphNodes = graphState ? graphState.nodes : [];
  const graphEdges = graphState ? graphState.edges : [];
  const adjList = graphState ? graphState.adjList : {};

  const resetGraphSimulation = () => {
    if (graphTimerRef.current) clearInterval(graphTimerRef.current);
    graphTimerRef.current = null;
    graphIteratorRef.current = null;
    setIsGraphRunning(false);
    setGraphVisitedNodes([]);
    setGraphActiveNode(null);
    setGraphActiveEdge(null);
    setGraphPathEdges([]);
    setGraphStatusText('idle');
    setGraphDistances({});
  };

  const loadPreset = (idx) => {
    resetGraphSimulation();
    setCurrentGraphIdx(idx);
    const preset = GRAPH_PRESETS[idx];
    setGraphState(JSON.parse(JSON.stringify(preset)));
    
    // Ensure start/target nodes are valid for the new preset
    const numNodes = preset.nodes.length;
    let newStart = graphStartNode;
    let newTarget = graphTargetNode;
    
    if (newStart >= numNodes) {
      newStart = 0;
    }
    if (newTarget >= numNodes) {
      newTarget = numNodes - 1;
    }
    if (newStart === newTarget) {
      newTarget = (newStart + 1) % numNodes;
    }
    
    setGraphStartNode(newStart);
    setGraphTargetNode(newTarget);
  };

  const handleShuffleGraph = () => {
    const nextIdx = (currentGraphIdx + 1) % GRAPH_PRESETS.length;
    loadPreset(nextIdx);
  };

  const handleShuffleNodePositions = () => {
    resetGraphSimulation();
    if (!graphState) return;
    
    // Get all coordinates
    const coords = graphState.nodes.map(n => ({ x: n.x, y: n.y }));
    // Shuffle coords
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = coords[i];
      coords[i] = coords[j];
      coords[j] = temp;
    }
    
    // Assign back
    const newNodes = graphState.nodes.map((node, idx) => ({
      ...node,
      x: coords[idx].x,
      y: coords[idx].y
    }));
    
    setGraphState({
      ...graphState,
      nodes: newNodes
    });
  };

  const handleShuffleEdgeWeights = () => {
    resetGraphSimulation();
    if (!graphState) return;
    
    const newEdges = graphState.edges.map(edge => ({
      ...edge,
      weight: Math.floor(Math.random() * 9) + 1
    }));
    
    // Rebuild adjList
    const newAdjList = {};
    graphState.nodes.forEach(node => {
      newAdjList[node.id] = [];
    });
    newEdges.forEach(edge => {
      newAdjList[edge.from].push({ to: edge.to, weight: edge.weight });
      newAdjList[edge.to].push({ to: edge.from, weight: edge.weight });
    });
    
    setGraphState({
      ...graphState,
      edges: newEdges,
      adjList: newAdjList
    });
  };

  const handleResetGraphLayout = () => {
    resetGraphSimulation();
    const preset = GRAPH_PRESETS[currentGraphIdx];
    setGraphState(JSON.parse(JSON.stringify(preset)));
  };

  const runGraphSimulation = () => {
    if (isGraphRunning) {
      if (graphTimerRef.current) clearInterval(graphTimerRef.current);
      setIsGraphRunning(false);
      return;
    }

    setIsGraphRunning(true);
    setGraphStatusText('running');

    if (!graphIteratorRef.current) {
      let generator;
      switch (graphAlgo) {
        case 'bfs':
          generator = bfsGraphGen(graphNodes, graphStartNode, graphTargetNode, adjList);
          break;
        case 'dfs':
          generator = dfsGraphGen(graphNodes, graphStartNode, graphTargetNode, adjList);
          break;
        case 'dijkstra':
          generator = dijkstraGraphGen(graphNodes, graphStartNode, graphTargetNode, adjList);
          break;
        default:
          generator = dijkstraGraphGen(graphNodes, graphStartNode, graphTargetNode, adjList);
      }
      graphIteratorRef.current = generator;
    }

    graphTimerRef.current = setInterval(() => {
      const next = graphIteratorRef.current.next();
      if (next.done) {
        if (graphTimerRef.current) clearInterval(graphTimerRef.current);
        setIsGraphRunning(false);
        setGraphActiveNode(null);
        setGraphActiveEdge(null);
        setGraphStatusText('complete');
      } else {
        const val = next.value;
        setGraphVisitedNodes(val.visitedNodes || []);
        setGraphActiveNode(val.activeNode);
        setGraphActiveEdge(val.activeEdge);
        setGraphPathEdges(val.pathEdges || []);
        setGraphStatusText(val.status || 'running');
        setGraphDistances(val.distances || {});
      }
    }, graphSpeed);
  };

  // ==========================================
  // N-QUEENS CHESSBOARD STATE & CONTROLS
  // ==========================================
  const [boardN, setBoardN] = useState(8);
  const [queensBoard, setQueensBoard] = useState(Array(8).fill(-1));
  const [queensStatus, setQueensStatus] = useState('idle'); // idle | solving | solved | conflict | backtracking
  const [queensActiveCell, setQueensActiveCell] = useState({ row: -1, col: -1 });
  const [isQueensSolving, setIsQueensSolving] = useState(false);
  const [queensSpeed, setQueensSpeed] = useState(120);

  const queensIteratorRef = useRef(null);
  const queensTimerRef = useRef(null);

  const handleQueensNChange = (e) => {
    const val = Number(e.target.value);
    setBoardN(val);
    handleResetQueens(val);
  };

  const handleStartQueens = () => {
    if (isQueensSolving) {
      if (queensTimerRef.current) clearInterval(queensTimerRef.current);
      setIsQueensSolving(false);
      return;
    }

    setIsQueensSolving(true);
    setQueensStatus('solving');

    if (!queensIteratorRef.current) {
      const generator = solveNQueensGen(boardN, Array(boardN).fill(-1));
      queensIteratorRef.current = generator;
    }

    queensTimerRef.current = setInterval(() => {
      const next = queensIteratorRef.current.next();
      if (next.done) {
        if (queensTimerRef.current) clearInterval(queensTimerRef.current);
        setIsQueensSolving(false);
        setQueensActiveCell({ row: -1, col: -1 });
        queensIteratorRef.current = null;
      } else {
        const { board, status, activeRow, activeCol } = next.value;
        setQueensBoard(board);
        setQueensStatus(status);
        setQueensActiveCell({ row: activeRow, col: activeCol });
      }
    }, queensSpeed);
  };

  const handleResetQueens = (nVal = boardN) => {
    if (queensTimerRef.current) clearInterval(queensTimerRef.current);
    setIsQueensSolving(false);
    setQueensBoard(Array(nVal).fill(-1));
    setQueensStatus('idle');
    setQueensActiveCell({ row: -1, col: -1 });
    queensIteratorRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (queensTimerRef.current) clearInterval(queensTimerRef.current);
    };
  }, []);

  // ==========================================
  // STRING MATCHING STATE & CONTROLS
  // ==========================================
  const [stringText, setStringText] = useState("AABACAADAABAABA");
  const [stringPattern, setStringPattern] = useState("AABA");
  const [stringAlgo, setStringAlgo] = useState("naive"); // naive | horspool | boyer_moore
  const [stringSpeed, setStringSpeed] = useState(300); // ms
  const [isStringRunning, setIsStringRunning] = useState(false);
  const [stringShift, setStringShift] = useState(0);
  const [stringCharIdx, setStringCharIdx] = useState(-1);
  const [stringStatus, setStringStatus] = useState("idle");
  const [stringMatches, setStringMatches] = useState([]);
  const [stringCompareResult, setStringCompareResult] = useState("");
  const [stringComparedIndices, setStringComparedIndices] = useState([]);
  const [stringPatternIndices, setStringPatternIndices] = useState([]);
  const [stringExplanation, setStringExplanation] = useState("Click Play to start string matching.");
  const [stringComparisons, setStringComparisons] = useState(0);
  const [stringShifts, setStringShifts] = useState(0);

  const stringIteratorRef = useRef(null);
  const stringTimerRef = useRef(null);

  const resetStringSimulation = () => {
    if (stringTimerRef.current) clearInterval(stringTimerRef.current);
    stringTimerRef.current = null;
    stringIteratorRef.current = null;
    setIsStringRunning(false);
    setStringShift(0);
    setStringCharIdx(-1);
    setStringStatus("idle");
    setStringMatches([]);
    setStringCompareResult("");
    setStringComparedIndices([]);
    setStringPatternIndices([]);
    setStringExplanation("Simulation reset. Click Play to start.");
    setStringComparisons(0);
    setStringShifts(0);
  };

  const runStringSimulation = () => {
    if (isStringRunning) {
      if (stringTimerRef.current) clearInterval(stringTimerRef.current);
      setIsStringRunning(false);
      return;
    }

    setIsStringRunning(true);
    setStringStatus('running');

    if (!stringIteratorRef.current) {
      let generator;
      switch (stringAlgo) {
        case 'naive':
          generator = naiveSearchGen(stringText, stringPattern);
          break;
        case 'horspool':
          generator = horspoolSearchGen(stringText, stringPattern);
          break;
        case 'boyer_moore':
          generator = boyerMooreSearchGen(stringText, stringPattern);
          break;
        default:
          generator = naiveSearchGen(stringText, stringPattern);
      }
      stringIteratorRef.current = generator;
    }

    stringTimerRef.current = setInterval(() => {
      const next = stringIteratorRef.current.next();
      if (next.done) {
        if (stringTimerRef.current) clearInterval(stringTimerRef.current);
        setIsStringRunning(false);
        setStringStatus('complete');
        stringIteratorRef.current = null;
      } else {
        const val = next.value;
        setStringShift(val.shift);
        setStringCharIdx(val.charIdx);
        setStringStatus(val.status);
        setStringMatches(val.matches || []);
        setStringCompareResult(val.compareResult || '');
        setStringComparedIndices(val.comparedIndices || []);
        setStringPatternIndices(val.patternIndices || []);
        setStringExplanation(val.explanation || '');
        setStringComparisons(val.totalComparisons || 0);
        setStringShifts(val.totalShifts || 0);
      }
    }, stringSpeed);
  };

  useEffect(() => {
    return () => {
      if (stringTimerRef.current) clearInterval(stringTimerRef.current);
    };
  }, []);

  return (
    <div className="page-transition space-y-8">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/40 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Algorithm Simulator</h1>
          <p className="text-slate-500">Real-time execution sandbox visualizer</p>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex bg-slate-800/20 border border-slate-700/20 p-1 rounded-xl shadow-xs">
          <button
            onClick={() => { setActiveTab('sorting'); resetStringSimulation(); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'sorting' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Columns className="w-3.5 h-3.5" /> Sorting
          </button>
          <button
            onClick={() => { setActiveTab('pathfinding'); resetStringSimulation(); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'pathfinding' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <GridIcon className="w-3.5 h-3.5" /> Pathfinding
          </button>
          <button
            onClick={() => { setActiveTab('backtracking'); resetStringSimulation(); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'backtracking' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Hash className="w-3.5 h-3.5" /> Backtracking
          </button>
          <button
            onClick={() => { setActiveTab('string'); resetStringSimulation(); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'string' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> String Matching
          </button>
        </div>
      </div>

      {/* ======================================================================
          TAB 1: SORTING SIMULATOR
          ====================================================================== */}
      {activeTab === 'sorting' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Box */}
          <div className="lg:col-span-1 glass-card rounded-2xl p-6 space-y-6 h-fit">
            <h3 className="text-lg font-bold border-b border-slate-200/40 pb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Sorting Options
            </h3>
            
            <div className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="space-y-1.5">
                <label className="block">Algorithm</label>
                <select
                  value={sortAlgo}
                  onChange={(e) => {
                    setSortAlgo(e.target.value);
                    handleResetSort();
                  }}
                  disabled={isSorting}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
                >
                  <option value="quick">Quick Sort</option>
                  <option value="bubble">Bubble Sort</option>
                  <option value="selection">Selection Sort</option>
                  <option value="insertion">Insertion Sort</option>
                  <option value="merge">Merge Sort</option>
                  <option value="heap">Heap Sort</option>
                </select>
              </div>

              {sortAlgo === 'quick' && (
                <div className="space-y-3 border-t border-slate-200/10 pt-3">
                  <div className="space-y-1.5">
                    <label className="block">Pivot Strategy</label>
                    <select
                      value={quickSortPivotStrategy}
                      onChange={(e) => {
                        setQuickSortPivotStrategy(e.target.value);
                        handleResetSort();
                      }}
                      disabled={isSorting}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
                    >
                      <option value="last">Last Element</option>
                      <option value="first">First Element</option>
                      <option value="middle">Middle Element</option>
                      <option value="random">Random Element</option>
                      <option value="custom">Custom Element Value</option>
                    </select>
                  </div>

                  {quickSortPivotStrategy === 'custom' && (
                    <div className="space-y-1.5">
                      <label className="block text-slate-400">Custom Pivot Value</label>
                      <input
                        type="number"
                        value={quickSortCustomPivotVal}
                        onChange={(e) => {
                          setQuickSortCustomPivotVal(e.target.value);
                          handleResetSort();
                        }}
                        placeholder="e.g. 30"
                        disabled={isSorting}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block">Speed (Delay: {sortSpeed}ms)</label>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={10}
                  value={sortSpeed}
                  onChange={(e) => setSortSpeed(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-1.5 border-t border-slate-200/10 pt-3">
                <label className="block text-slate-400">Custom Array (max 30 elements)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSortInput}
                    onChange={(e) => setCustomSortInput(e.target.value)}
                    placeholder="e.g. 50, 120, 80, 15, 95"
                    disabled={isSorting}
                    className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none text-xs"
                  />
                  <button
                    onClick={() => {
                      if (!customSortInput) return;
                      const parsed = customSortInput.split(',')
                        .map(num => parseInt(num.trim()))
                        .filter(num => !isNaN(num) && num > 0)
                        .slice(0, 30);
                      if (parsed.length > 0) {
                        resetSortTimer();
                        setSortArray(parsed);
                        setActiveIndices([]);
                        setCompareType('');
                        setIsSorting(false);
                        resetMarkers();
                      }
                    }}
                    disabled={isSorting}
                    className="flex-shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-all text-xs flex items-center"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleStartSort}
                className="w-full flex items-center justify-center gap-2 btn-neon rounded-xl py-3 font-bold text-sm cursor-pointer"
              >
                {isSorting ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                {isSorting ? "Pause" : "Play Simulation"}
              </button>
              <button
                onClick={handleResetSort}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-shuffle Array
              </button>
            </div>
          </div>

          {/* Simulator Visual Box */}
          <div className="lg:col-span-3 glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[350px] relative">
            <div className="border-b border-slate-200/40 pb-3 mb-4">
              <h3 className="text-lg font-bold">Bar Sort Sandbox</h3>
              <p className="text-xs text-slate-500">Visualizing item swaps during partition steps</p>
            </div>

            {/* Simulated array bars */}
            <div className="flex-1 flex items-end justify-center gap-1.5 min-h-[220px] pb-4 px-2 pt-6">
              {sortArray.map((height, idx) => {
                const isActive = activeIndices.includes(idx);
                
                // Determine bar color and special highlights
                let barColor = 'bg-indigo-500/80';
                let label = '';
                
                if (isActive) {
                  barColor = compareType === 'compare' ? 'bg-rose-500' : 'bg-emerald-500 ring-2 ring-emerald-300';
                } else if (sortAlgo === 'quick' && idx === pivotIndex) {
                  barColor = 'bg-purple-600 ring-2 ring-purple-400';
                  label = 'P';
                } else if (sortAlgo === 'selection' && idx === minIndex) {
                  barColor = 'bg-amber-500 ring-2 ring-amber-300';
                  label = 'M';
                } else if (sortAlgo === 'insertion' && idx === keyIndex) {
                  barColor = 'bg-cyan-500 ring-2 ring-cyan-300';
                  label = 'K';
                } else if (sortAlgo === 'merge' && idx === mergeActiveIndex) {
                  barColor = 'bg-teal-500 ring-2 ring-teal-300';
                  label = 'A';
                } else if (sortAlgo === 'heap' && idx === heapRootIndex) {
                  barColor = 'bg-pink-500 ring-2 ring-pink-300';
                  label = 'R';
                } else {
                  // Dim sorted elements if boundary is set
                  if (sortedBoundary !== -1) {
                    if (sortAlgo === 'bubble' && idx >= sortedBoundary) {
                      barColor = 'opacity-35 bg-indigo-500/30';
                    } else if (sortAlgo === 'selection' && idx < sortedBoundary) {
                      barColor = 'opacity-35 bg-indigo-500/30';
                    } else if (sortAlgo === 'insertion' && idx < sortedBoundary) {
                      barColor = 'opacity-35 bg-indigo-500/30';
                    } else if (sortAlgo === 'heap' && idx >= sortedBoundary) {
                      barColor = 'opacity-35 bg-indigo-500/30';
                    }
                  }
                  
                  // Highlight merge range for Merge Sort
                  if (sortAlgo === 'merge' && mergeRange && mergeRange.length === 2) {
                    const [l, r] = mergeRange;
                    if (idx >= l && idx <= r) {
                      barColor = 'bg-indigo-500/60 ring-1 ring-indigo-500/30';
                    }
                  }
                }

                const maxVal = sortArray.length > 0 ? Math.max(...sortArray) : 1;
                const safeMaxVal = maxVal > 0 ? maxVal : 1;
                const scaledHeight = (height / safeMaxVal) * 160;

                return (
                  <div key={idx} className="flex flex-col justify-end items-center flex-grow relative" style={{ height: '100%' }}>
                    {label && (
                      <span className="absolute -top-7 text-[9px] font-extrabold text-[var(--text-primary)] bg-slate-900 border border-slate-700 px-1 py-0.5 rounded shadow-sm scale-90 select-none z-20">
                        {label === 'P' ? 'Pivot' : label === 'M' ? 'Min' : label === 'K' ? 'Key' : label === 'A' ? 'Active' : 'Root'}
                      </span>
                    )}
                    <div
                      className={`w-full rounded-t-sm transition-all duration-150 ${barColor}`}
                      style={{ height: `${scaledHeight}px` }}
                    />
                    <span className="text-[9px] md:text-[10px] font-mono mt-1.5 text-slate-400 dark:text-slate-500 select-none font-bold">
                      {height}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200/40 pt-4 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500"></span>
                  <span>Unsorted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
                  <span>Active Compare</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                  <span>Active Swap</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-purple-600"></span>
                  <span>Pivot (Quick)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span>Min Found (Selection)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span>
                  <span>Key (Insertion)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-teal-500"></span>
                  <span>Merge Target (Merge)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-pink-500"></span>
                  <span>Heap Root (Heap)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500/20 opacity-40"></span>
                  <span>Sorted Portion (Dimmed)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB 2: PATHFINDING SIMULATOR
          ====================================================================== */}
      {activeTab === 'pathfinding' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Box */}
          <div className="lg:col-span-1 glass-card rounded-2xl p-6 space-y-6 h-fit">
            <h3 className="text-lg font-bold border-b border-slate-200/40 pb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Graph Options
            </h3>

            <div className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="space-y-1.5">
                <label className="block">Graph Layout</label>
                <div className="flex gap-2">
                  <select
                    value={currentGraphIdx}
                    onChange={(e) => {
                      loadPreset(Number(e.target.value));
                    }}
                    disabled={isGraphRunning}
                    className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
                  >
                    {GRAPH_PRESETS.map((p, idx) => (
                      <option key={idx} value={idx}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleShuffleGraph}
                    disabled={isGraphRunning}
                    className="flex-shrink-0 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer transition-all flex items-center justify-center"
                    title="Next Preset Layout"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-200/20 pt-3">
                <label className="block text-slate-400">Shuffle Options</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleShuffleNodePositions}
                    disabled={isGraphRunning}
                    className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer transition-all text-[10px] text-center text-slate-700 dark:text-slate-300"
                    title="Scramble node layout positions"
                  >
                    Shuffle Layout
                  </button>
                  <button
                    onClick={handleShuffleEdgeWeights}
                    disabled={isGraphRunning}
                    className="py-2 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer transition-all text-[10px] text-center text-slate-700 dark:text-slate-300"
                    title="Randomize all edge weights"
                  >
                    Shuffle Weights
                  </button>
                </div>
                <button
                  onClick={handleResetGraphLayout}
                  disabled={isGraphRunning}
                  className="w-full mt-1.5 py-1.5 px-2 bg-slate-100/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all text-center cursor-pointer"
                >
                  Reset Preset Defaults
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block">Algorithm</label>
                <select
                  value={graphAlgo}
                  onChange={(e) => {
                    setGraphAlgo(e.target.value);
                    resetGraphSimulation();
                  }}
                  disabled={isGraphRunning}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
                >
                  <option value="dijkstra">Dijkstra's (Shortest Path)</option>
                  <option value="bfs">Breadth-First Search (BFS)</option>
                  <option value="dfs">Depth-First Search (DFS)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="block">Start Node</label>
                  <select
                    value={graphStartNode}
                    onChange={(e) => {
                      setGraphStartNode(Number(e.target.value));
                      resetGraphSimulation();
                    }}
                    disabled={isGraphRunning}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
                  >
                    {graphNodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block">Target Node</label>
                  <select
                    value={graphTargetNode}
                    onChange={(e) => {
                      setGraphTargetNode(Number(e.target.value));
                      resetGraphSimulation();
                    }}
                    disabled={isGraphRunning}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
                  >
                    {graphNodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block">Speed (Delay: {graphSpeed}ms)</label>
                <input
                  type="range"
                  min={100}
                  max={1000}
                  step={50}
                  value={graphSpeed}
                  onChange={(e) => setGraphSpeed(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="bg-slate-100/50 dark:bg-slate-800/30 border p-3 rounded-xl flex items-center justify-between font-bold text-[10px] text-indigo-600">
                <span>SIMULATOR STATUS:</span>
                <span className="uppercase text-slate-700 dark:text-slate-300">{graphStatusText}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={runGraphSimulation}
                className="w-full flex items-center justify-center gap-2 btn-neon rounded-xl py-3 font-bold text-sm cursor-pointer"
              >
                {isGraphRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                {isGraphRunning ? "Pause" : "Play Simulator"}
              </button>
              <button
                onClick={resetGraphSimulation}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Graph
              </button>
            </div>
          </div>

          {/* Graph Visual Box */}
          <div className="lg:col-span-3 glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[380px]">
            <div className="border-b border-slate-200/40 pb-3 mb-4">
              <h3 className="text-lg font-bold">Node-Link Adjacency Graph</h3>
              <p className="text-xs text-slate-500">Traversing nodes and edges with weight constraints</p>
            </div>

            {/* SVG Network Canvas */}
            <div className="flex-grow flex justify-center items-center bg-slate-900/40 dark:bg-slate-955/20 border border-slate-800/50 rounded-2xl p-4 overflow-hidden relative min-h-[300px]">
              <svg width="450" height="320" viewBox="0 0 450 320" className="max-w-full">
                {/* 1. Draw Edges */}
                {graphEdges.map((edge) => {
                  const fromNode = graphNodes.find(n => n.id === edge.from);
                  const toNode = graphNodes.find(n => n.id === edge.to);
                  const edgeKey = `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`;
                  
                  const isPath = graphPathEdges.includes(edgeKey);
                  const isActive = graphActiveEdge === edgeKey;
                  
                  let strokeColor = 'stroke-slate-700/60 dark:stroke-slate-800/80';
                  let strokeWidth = 2.5;
                  
                  if (isActive) {
                    strokeColor = 'stroke-rose-500';
                    strokeWidth = 4;
                  } else if (isPath) {
                    strokeColor = 'stroke-amber-400';
                    strokeWidth = 4;
                  }
                  
                  const midX = (fromNode.x + toNode.x) / 2;
                  const midY = (fromNode.y + toNode.y) / 2;
                  
                  return (
                    <g key={edgeKey}>
                      <line 
                        x1={fromNode.x} 
                        y1={fromNode.y} 
                        x2={toNode.x} 
                        y2={toNode.y} 
                        className={`transition-all duration-300 ${strokeColor}`} 
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                      />
                      <rect 
                        x={midX - 8} 
                        y={midY - 8} 
                        width="16" 
                        height="16" 
                        rx="4" 
                        className="fill-slate-900 stroke-slate-800/80" 
                        strokeWidth="1"
                      />
                      <text 
                        x={midX} 
                        y={midY + 4} 
                        textAnchor="middle" 
                        className="text-[9px] font-extrabold fill-slate-300 font-mono select-none"
                      >
                        {edge.weight}
                      </text>
                    </g>
                  );
                })}

                {/* 2. Draw Nodes */}
                {graphNodes.map((node) => {
                  const isVisited = graphVisitedNodes.includes(node.id);
                  const isActive = graphActiveNode === node.id;
                  const isStart = node.id === graphStartNode;
                  const isTarget = node.id === graphTargetNode;
                  
                  let nodeFill = 'fill-slate-800 dark:fill-slate-900';
                  let strokeColor = 'stroke-slate-700';
                  let strokeWidth = 2;
                  
                  if (isStart) {
                    nodeFill = 'fill-emerald-600';
                    strokeColor = 'stroke-emerald-400';
                    strokeWidth = 3;
                  } else if (isTarget) {
                    nodeFill = 'fill-rose-600';
                    strokeColor = 'stroke-rose-400';
                    strokeWidth = 3;
                  } else if (isActive) {
                    nodeFill = 'fill-rose-500';
                    strokeColor = 'stroke-rose-300';
                    strokeWidth = 3.5;
                  } else if (isVisited) {
                    nodeFill = 'fill-cyan-600';
                    strokeColor = 'stroke-cyan-300';
                    strokeWidth = 2.5;
                  }

                  return (
                    <g key={node.id} className="cursor-pointer">
                      <circle 
                        cx={node.x} 
                        cy={node.y} 
                        r="18" 
                        className={`transition-all duration-300 ${nodeFill} ${strokeColor}`} 
                        strokeWidth={strokeWidth}
                      />
                      <text 
                        x={node.x} 
                        y={node.y + 4.5} 
                        textAnchor="middle" 
                        className="text-[11px] font-extrabold fill-white select-none pointer-events-none"
                      >
                        {node.label}
                      </text>
                      
                      {graphAlgo === 'dijkstra' && graphDistances[node.id] !== undefined && (
                        <text 
                          x={node.x} 
                          y={node.y - 22} 
                          textAnchor="middle" 
                          className="text-[9px] font-bold fill-indigo-400 font-mono select-none"
                        >
                          dist={graphDistances[node.id] === Infinity ? '∞' : graphDistances[node.id]}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legends */}
            <div className="mt-4 pt-4 border-t border-slate-200/40 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-emerald-400"></div>
                <span>Start Node</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-rose-400"></div>
                <span>Target Node</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-300 animate-pulse"></div>
                <span>Active Visiting</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-600 border border-cyan-300"></div>
                <span>Visited Queue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-6 bg-amber-400 rounded"></div>
                <span>Shortest Path Edge</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          TAB 3: BACKTRACKING SIMULATOR
          ====================================================================== */}
      {activeTab === 'backtracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Box */}
          <div className="lg:col-span-1 glass-card rounded-2xl p-6 space-y-6 h-fit">
            <h3 className="text-lg font-bold border-b border-slate-200/40 pb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> N-Queens Settings
            </h3>

            <div className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="space-y-1.5">
                <label className="block">Board Dimension (N x N)</label>
                <select
                  value={boardN}
                  onChange={handleQueensNChange}
                  disabled={isQueensSolving}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
                >
                  <option value={4}>4 x 4 (2 solutions)</option>
                  <option value={5}>5 x 5 (10 solutions)</option>
                  <option value={6}>6 x 6 (4 solutions)</option>
                  <option value={8}>8 x 8 (92 solutions)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block">Solving Speed ({queensSpeed}ms)</label>
                <input
                  type="range"
                  min={30}
                  max={400}
                  step={10}
                  value={queensSpeed}
                  onChange={(e) => setQueensSpeed(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="bg-slate-100/50 dark:bg-slate-800/30 border p-3 rounded-xl flex items-center justify-between font-bold text-[10px] text-indigo-600">
                <span>BACKTRACK STATE:</span>
                <span className="uppercase text-slate-700 dark:text-slate-300">{queensStatus}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleStartQueens}
                className="w-full flex items-center justify-center gap-2 btn-neon rounded-xl py-3 font-bold text-sm cursor-pointer"
              >
                {isQueensSolving ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                {isQueensSolving ? "Pause" : "Play Simulator"}
              </button>
              <button
                onClick={() => handleResetQueens()}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Board
              </button>
            </div>
          </div>

          {/* Chessboard Visual Box */}
          <div className="lg:col-span-3 glass-card rounded-2xl p-6 flex flex-col justify-between">
            <div className="border-b border-slate-200/40 pb-3 mb-4">
              <h3 className="text-lg font-bold">N-Queens Backtracking Board</h3>
              <p className="text-xs text-slate-500">Recursive queen placing (yellow), conflicts (red), backtracking states</p>
            </div>

            {/* Chessboard */}
            <div className="flex-1 overflow-x-auto pb-4">
              <div 
                className="grid gap-[1px] bg-slate-300 dark:bg-slate-800 p-1 border rounded-lg mx-auto w-fit"
                style={{ 
                  gridTemplateColumns: `repeat(${boardN}, minmax(0, 1fr))` 
                }}
              >
                {Array(boardN).fill(null).map((_, rIdx) => 
                  Array(boardN).fill(null).map((_, cIdx) => {
                    const isDarkCell = (rIdx + cIdx) % 2 === 1;
                    const hasQueen = queensBoard[rIdx] === cIdx;
                    const isActive = queensActiveCell.row === rIdx && queensActiveCell.col === cIdx;
                    
                    let cellBg = isDarkCell ? 'bg-slate-400 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-600';
                    if (isActive) {
                      if (queensStatus === 'conflict') cellBg = 'bg-rose-500 animate-pulse border-2 border-red-300';
                      else if (queensStatus === 'backtracking') cellBg = 'bg-orange-400 border-2 border-orange-200';
                      else cellBg = 'bg-indigo-500 border-2 border-indigo-200';
                    } else if (hasQueen) {
                      cellBg = 'bg-amber-400 border border-amber-300';
                    }

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg font-bold select-none ${cellBg}`}
                      >
                        {hasQueen && (
                          <span className="text-slate-800 select-none cursor-default drop-shadow-sm font-sans">♛</span>
                        )}
                        {!hasQueen && isActive && (
                          <span className="text-xs text-slate-300 scale-75 opacity-75 font-sans">?</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200/40 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-amber-400 flex items-center justify-center text-[10px] text-slate-800">♛</div>
                <span>Queen Placed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-indigo-500 border border-indigo-300"></div>
                <span>Scanning Placement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-300"></div>
                <span>Placement Conflict</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-orange-400 border border-orange-200"></div>
                <span>Backtracking Step</span>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ======================================================================
            TAB 4: STRING MATCHING SIMULATOR
            ====================================================================== */}
        {activeTab === 'string' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Settings Box */}
            <div className="lg:col-span-1 glass-card rounded-2xl p-6 space-y-6 h-fit">
              <h3 className="text-lg font-bold border-b border-slate-200/40 pb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> String Options
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-500">
                <div className="space-y-1.5">
                  <label className="block">Text (Custom String)</label>
                  <textarea
                     value={stringText}
                     onChange={(e) => {
                       setStringText(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 40));
                       resetStringSimulation();
                     }}
                     disabled={isStringRunning}
                     placeholder="e.g. AABACAADAABAABA"
                     rows={2}
                     className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none uppercase"
                  />
                  <span className="text-[10px] text-slate-400 font-normal">Max 40 letters, A-Z only</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block">Pattern to Find</label>
                  <input
                    type="text"
                    value={stringPattern}
                    onChange={(e) => {
                      setStringPattern(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10));
                      resetStringSimulation();
                    }}
                    disabled={isStringRunning}
                    placeholder="e.g. AABA"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none uppercase"
                  />
                  <span className="text-[10px] text-slate-400 font-normal">Max 10 letters, A-Z only</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block">Algorithm</label>
                  <select
                    value={stringAlgo}
                    onChange={(e) => {
                      setStringAlgo(e.target.value);
                      resetStringSimulation();
                    }}
                    disabled={isStringRunning}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
                  >
                    <option value="naive">Naive Search (Brute Force)</option>
                    <option value="horspool">Horspool Matching</option>
                    <option value="boyer_moore">Boyer-Moore</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block">Simulation Speed ({stringSpeed}ms)</label>
                  <input
                    type="range"
                    min={100}
                    max={1500}
                    step={50}
                    value={stringSpeed}
                    onChange={(e) => setStringSpeed(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="bg-slate-100/50 dark:bg-slate-800/30 border p-3 rounded-xl flex items-center justify-between font-bold text-[10px] text-indigo-600">
                  <span>SIMULATOR STATUS:</span>
                  <span className="uppercase text-slate-700 dark:text-slate-300">{stringStatus}</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={runStringSimulation}
                  disabled={stringText.length === 0 || stringPattern.length === 0}
                  className="w-full flex items-center justify-center gap-2 btn-neon rounded-xl py-3 font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStringRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  {isStringRunning ? "Pause" : "Play Simulator"}
                </button>
                <button
                  onClick={resetStringSimulation}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Simulation
                </button>
              </div>
            </div>

            {/* Grid Visual Box */}
            <div className="lg:col-span-3 glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="border-b border-slate-200/40 pb-3 mb-6">
                  <h3 className="text-lg font-bold">Character Shift Sandbox</h3>
                  <p className="text-xs text-slate-500">Visualizing string search shifts and comparisons</p>
                </div>

                {/* String Matching Grid View */}
                <div className="overflow-x-auto min-h-[180px] w-full pb-2">
                  <div className="w-max mx-auto flex flex-col gap-6 py-6 px-4">
                    {/* 1. Text Row */}
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Text String</div>
                      <div className="flex gap-1.5 justify-start">
                        {stringText.split('').map((char, idx) => {
                          const isCompared = stringComparedIndices.includes(idx);
                          const isMatch = isCompared && stringCompareResult === 'match';
                          const isMismatch = isCompared && stringCompareResult === 'mismatch';
                          const isMatched = stringMatches.some(mShift => idx >= mShift && idx < mShift + stringPattern.length);
                          
                          let cellBg = 'bg-slate-850 dark:bg-slate-900 border-slate-700/40';
                          let textColors = 'text-slate-300';
                          
                          if (isMatched) {
                             cellBg = 'bg-emerald-500/20 border-emerald-500/70';
                             textColors = 'text-emerald-400 font-extrabold';
                          } else if (isMismatch) {
                            cellBg = 'bg-rose-500 border-rose-455 text-white animate-pulse';
                            textColors = 'text-white font-extrabold';
                          } else if (isMatch) {
                            cellBg = 'bg-emerald-555 border-emerald-455';
                            textColors = 'text-white font-extrabold';
                          } else if (isCompared) {
                            cellBg = 'bg-indigo-600 border-indigo-400';
                            textColors = 'text-white font-extrabold';
                          }
                          
                          return (
                            <div 
                              key={`text-${idx}`} 
                              className={`w-9 h-9 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center border rounded-xl text-sm transition-all duration-150 ${cellBg} ${textColors}`}
                              title={`Index: ${idx}`}
                            >
                              {char}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Pattern Row */}
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Pattern Shift</div>
                      <div className="flex gap-1.5 justify-start relative">
                        {/* Empty cells as spacer */}
                        {Array.from({ length: stringShift }).map((_, idx) => (
                          <div key={`spacer-${idx}`} className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 opacity-0" />
                        ))}
                        {/* Pattern cells */}
                        {stringPattern.split('').map((char, idx) => {
                          const isActive = stringPatternIndices.includes(idx);
                          const isMatch = isActive && stringCompareResult === 'match';
                          const isMismatch = isActive && stringCompareResult === 'mismatch';
                          const absoluteTextIdx = stringShift + idx;
                          const isMatched = stringMatches.some(mShift => absoluteTextIdx >= mShift && absoluteTextIdx < mShift + stringPattern.length);
                          
                          let cellBg = 'bg-slate-700/30 border-slate-700/20';
                          let textColors = 'text-slate-400';
                          
                          if (isMatched) {
                            cellBg = 'bg-emerald-500/20 border-emerald-500/60';
                            textColors = 'text-emerald-400 font-extrabold';
                          } else if (isMismatch) {
                            cellBg = 'bg-rose-500 border-rose-455 text-white animate-pulse';
                            textColors = 'text-white font-extrabold';
                          } else if (isMatch) {
                            cellBg = 'bg-emerald-555 border-emerald-455';
                            textColors = 'text-white font-extrabold';
                          } else if (isActive) {
                            cellBg = 'bg-indigo-600 border-indigo-400';
                             textColors = 'text-white font-extrabold';
                          }
                          
                          return (
                            <div 
                              key={`pattern-${idx}`} 
                              className={`w-9 h-9 md:w-10 md:h-10 flex-shrink-0 flex items-center justify-center border rounded-xl text-sm transition-all duration-150 ${cellBg} ${textColors}`}
                              title={`Pattern index: ${idx}`}
                            >
                              {char}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Console log explanation */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-300 min-h-[60px] flex items-center gap-3">
                  <span className="text-indigo-400 font-extrabold select-none">&gt;&gt;</span>
                  <span>{stringExplanation}</span>
                </div>

                {/* Preprocessing Tables and Telemetry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-200/10">
                  {/* Left Column: Step Telemetry */}
                  <div className="glass-card/10 border border-slate-800/40 p-4 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step Telemetry</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 text-center">
                        <span className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Comparisons</span>
                        <span className="text-lg font-extrabold text-indigo-400 font-mono">{stringComparisons}</span>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 text-center">
                        <span className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Total Shifts</span>
                        <span className="text-lg font-extrabold text-amber-400 font-mono">{stringShifts}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold text-center italic">
                      Current Shift Index: {stringShift} | Comparing pattern char: {stringCharIdx !== -1 ? stringPattern[stringCharIdx] : 'None'}
                    </div>
                  </div>

                  {/* Right Column: Preprocessing Tables */}
                  <div className="glass-card/10 border border-slate-800/40 p-4 rounded-xl space-y-4 max-h-[220px] overflow-y-auto">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preprocessing Tables</h4>
                    
                    {stringAlgo === 'naive' && (
                      <div className="text-xs text-slate-500 text-center py-6 font-medium">
                        Naive string matching (Brute Force) does not require any precomputed shift tables.
                      </div>
                    )}

                    {stringAlgo === 'horspool' && (
                      <div className="space-y-2">
                        <span className="block text-[10px] font-bold text-indigo-400 uppercase">Bad Symbol Table (Shift Values)</span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-mono text-[11px] text-slate-300">
                            <thead>
                              <tr className="border-b border-slate-800/80 text-slate-500 text-[9px] uppercase">
                                <th className="pb-1">Character</th>
                                <th className="pb-1 text-right">Shift Distance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(getHorspoolTable(stringPattern)).map(([char, val]) => (
                                <tr key={char} className="border-b border-slate-800/30">
                                  <td className="py-1 text-slate-200 font-extrabold">{char}</td>
                                  <td className="py-1 text-right text-indigo-300 font-extrabold">{val}</td>
                                </tr>
                              ))}
                              <tr>
                                <td className="py-1 text-slate-400 font-medium">* (any other)</td>
                                <td className="py-1 text-right text-indigo-400 font-extrabold">{stringPattern.length}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {stringAlgo === 'boyer_moore' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="block text-[9px] font-bold text-indigo-400 uppercase">Bad Character Table</span>
                          <table className="w-full text-left font-mono text-[10px] text-slate-300">
                            <thead>
                              <tr className="border-b border-slate-800/80 text-slate-500 text-[8px] uppercase">
                                <th className="pb-1">Char</th>
                                <th className="pb-1 text-right">Last Index</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(getBoyerMooreBadCharTable(stringPattern)).map(([char, idx]) => (
                                <tr key={char} className="border-b border-slate-800/30">
                                  <td className="py-0.5 text-slate-200 font-extrabold">{char}</td>
                                  <td className="py-0.5 text-right text-indigo-300 font-extrabold">{idx}</td>
                                </tr>
                              ))}
                              <tr>
                                <td className="py-0.5 text-slate-400 font-medium">*</td>
                                <td className="py-0.5 text-right text-indigo-400 font-extrabold">-1</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="space-y-2">
                          <span className="block text-[9px] font-bold text-amber-400 uppercase">Good Suffix Table</span>
                          <table className="w-full text-left font-mono text-[10px] text-slate-300">
                            <thead>
                              <tr className="border-b border-slate-800/80 text-slate-500 text-[8px] uppercase">
                                <th className="pb-1">Mismatch j</th>
                                <th className="pb-1 text-right">Shift Distance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getBoyerMooreGoodSuffixTable(stringPattern).map((val, idx) => (
                                <tr key={idx} className="border-b border-slate-800/30">
                                  <td className="py-0.5 text-slate-400 font-medium">Index {idx}</td>
                                  <td className="py-0.5 text-right text-amber-300 font-extrabold">{val}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Legends */}
              <div className="mt-6 pt-4 border-t border-slate-200/40 flex flex-wrap items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-md bg-slate-850 dark:bg-slate-900 border border-slate-700/40"></div>
                  <span>Unexplored</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-md bg-indigo-600 border border-indigo-400"></div>
                  <span>Compared</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-455"></div>
                  <span>Mismatch</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-400"></div>
                  <span>Matched Sequence</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
