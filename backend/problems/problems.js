// problems.js - All GPU/Hardware Programming Problems
export const problems = [
  // ==================== CUDA FUNDAMENTALS ====================
  {
    id: "cuda-hello-gpu",
    title: "Hello, GPU",
    slug: "hello-gpu",
    difficulty: "novice",
    category: "CUDA Fundamentals",
    xp: 50,
    tags: ["cuda", "kernel", "threads"],
    description: `## Hello, GPU

Your first GPU kernel. Launch a CUDA kernel that writes the thread index into an output array.

**Task:** Fill array \`out[]\` where \`out[i] = i\` for all \`i\` from 0 to N-1, using a parallel CUDA kernel.

**Constraints:**
- \`N = 1024\`
- Use 1D thread blocks of size 256
- Each thread should handle exactly one element`,
    examples: [
      { input: "N=8", output: "out = [0, 1, 2, 3, 4, 5, 6, 7]" }
    ],
    hints: [
      "Use `threadIdx.x + blockIdx.x * blockDim.x` to compute global thread ID",
      "Ensure you check bounds: `if (idx < N)`"
    ],
    starterCode: {
      cuda: `#include <cuda_runtime.h>
#include <stdio.h>

__global__ void helloKernel(int* out, int N) {
    // Your code here
    
}

int main() {
    int N = 1024;
    int *d_out, *h_out;
    h_out = (int*)malloc(N * sizeof(int));
    cudaMalloc(&d_out, N * sizeof(int));
    
    // Launch kernel - fill in dimensions
    helloKernel<<<???, ???>>>(d_out, N);
    
    cudaMemcpy(h_out, d_out, N * sizeof(int), cudaMemcpyDeviceToHost);
    
    // Verify
    for(int i = 0; i < N; i++) {
        if(h_out[i] != i) { printf("FAIL at %d\\n", i); return 1; }
    }
    printf("PASS\\n");
    cudaFree(d_out); free(h_out);
    return 0;
}`,
      cpu_reference: `// CPU reference solution
for(int i = 0; i < N; i++) out[i] = i;`
    },
    solution: `__global__ void helloKernel(int* out, int N) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;
    if (idx < N) out[idx] = idx;
}
// Launch: helloKernel<<<4, 256>>>(d_out, N);`,
    testCases: [
      { id: 1, description: "N=1024, check all elements", pass: true },
      { id: 2, description: "Boundary check: last element = N-1", pass: true },
      { id: 3, description: "Grid dimension correctness", pass: true }
    ],
    conceptExplanation: "GPU threads are organized into blocks. `threadIdx.x` is local to the block, `blockIdx.x * blockDim.x` offsets to the global position.",
    companies: ["NVIDIA", "AMD", "Intel"],
    acceptance: 78
  },
  {
    id: "cuda-vector-add",
    title: "Parallel Vector Addition",
    slug: "parallel-vector-add",
    difficulty: "novice",
    category: "CUDA Fundamentals",
    xp: 75,
    tags: ["cuda", "memory", "parallelism"],
    description: `## Parallel Vector Addition

The "Hello World" of GPU programming. Add two large vectors in parallel.

**Task:** Given arrays A and B of length N, compute C[i] = A[i] + B[i] for all i.

**Performance Goal:** Achieve >90% memory bandwidth utilization.

**Constraints:**
- N can be up to 10^8
- Use coalesced memory access
- Minimize CPU-GPU transfers`,
    examples: [
      { input: "A=[1,2,3], B=[4,5,6]", output: "C=[5,7,9]" }
    ],
    hints: [
      "Memory bandwidth = (3 * N * sizeof(float)) / time",
      "Coalesced access: consecutive threads access consecutive memory addresses"
    ],
    starterCode: {
      cuda: `#include <cuda_runtime.h>

__global__ void vectorAdd(const float* A, const float* B, float* C, int N) {
    // TODO: Implement parallel vector addition
}

// Host code
void solve(float* h_A, float* h_B, float* h_C, int N) {
    float *d_A, *d_B, *d_C;
    // TODO: Allocate, copy, launch, retrieve
}`,
      cpu_reference: `for(int i = 0; i < N; i++) C[i] = A[i] + B[i];`
    },
    solution: `__global__ void vectorAdd(const float* A, const float* B, float* C, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) C[i] = A[i] + B[i];
}`,
    testCases: [
      { id: 1, description: "Correctness: N=1024", pass: true },
      { id: 2, description: "Large N=10^7 correctness", pass: true },
      { id: 3, description: "Bandwidth utilization > 60%", pass: true }
    ],
    conceptExplanation: "Coalesced memory access occurs when consecutive threads in a warp access consecutive memory locations, maximizing memory bus utilization.",
    companies: ["NVIDIA", "Google", "Meta"],
    acceptance: 71
  },
  {
    id: "cuda-matrix-multiply",
    title: "Matrix Multiplication: Tiled GEMM",
    slug: "tiled-matmul",
    difficulty: "warrior",
    category: "CUDA Fundamentals",
    xp: 200,
    tags: ["cuda", "shared memory", "tiling", "GEMM"],
    description: `## Matrix Multiplication: Tiled GEMM

Implement an optimized matrix multiplication using shared memory tiling — the cornerstone of deep learning.

**Task:** Compute C = A × B where A is M×K, B is K×N, C is M×N.

**Optimization Goals:**
1. Use shared memory tiles to reduce global memory traffic
2. Tile size: 16×16 or 32×32
3. Must be faster than naïve O(MNK) parallel version by >2x

**Why this matters:** cuBLAS, every transformer forward pass, conv layers — all GEMM.`,
    examples: [
      { input: "A=[[1,2],[3,4]], B=[[5,6],[7,8]]", output: "C=[[19,22],[43,50]]" }
    ],
    hints: [
      "Load tile of A into shared mem, tile of B into shared mem, sync threads",
      "__syncthreads() is required between load and compute phases",
      "Each tile computation: `for(k) C_local += sA[ty][k] * sB[k][tx]`"
    ],
    starterCode: {
      cuda: `#define TILE_SIZE 16

__global__ void tiledMatMul(float* A, float* B, float* C, int M, int K, int N) {
    __shared__ float sA[TILE_SIZE][TILE_SIZE];
    __shared__ float sB[TILE_SIZE][TILE_SIZE];
    
    int row = blockIdx.y * TILE_SIZE + threadIdx.y;
    int col = blockIdx.x * TILE_SIZE + threadIdx.x;
    float sum = 0.0f;
    
    // TODO: Loop over tiles, load into shared mem, compute partial sums
    
    if (row < M && col < N) C[row * N + col] = sum;
}`,
      cpu_reference: `for(int i=0;i<M;i++) for(int j=0;j<N;j++) for(int k=0;k<K;k++) C[i*N+j]+=A[i*K+k]*B[k*N+j];`
    },
    solution: `// Full tiled GEMM with boundary handling
for (int t = 0; t < (K + TILE_SIZE - 1) / TILE_SIZE; t++) {
    if (row < M && t*TILE_SIZE+threadIdx.x < K) sA[threadIdx.y][threadIdx.x] = A[row*K + t*TILE_SIZE + threadIdx.x];
    else sA[threadIdx.y][threadIdx.x] = 0;
    if (col < N && t*TILE_SIZE+threadIdx.y < K) sB[threadIdx.y][threadIdx.x] = B[(t*TILE_SIZE+threadIdx.y)*N + col];
    else sB[threadIdx.y][threadIdx.x] = 0;
    __syncthreads();
    for (int k = 0; k < TILE_SIZE; k++) sum += sA[threadIdx.y][k] * sB[k][threadIdx.x];
    __syncthreads();
}`,
    testCases: [
      { id: 1, description: "4x4 matrix correctness", pass: true },
      { id: 2, description: "Non-square matrices", pass: true },
      { id: 3, description: "2x speedup vs naive", pass: true },
      { id: 4, description: "1024x1024 matrices", pass: true }
    ],
    conceptExplanation: "Shared memory has ~100x lower latency than global memory. Tiling reduces global memory accesses from O(N³) to O(N³/TILE_SIZE).",
    companies: ["NVIDIA", "Google", "OpenAI", "Meta"],
    acceptance: 34
  },
  {
    id: "cuda-reduction",
    title: "Parallel Reduction: Sum",
    slug: "parallel-reduction",
    difficulty: "warrior",
    category: "CUDA Fundamentals",
    xp: 175,
    tags: ["cuda", "reduction", "warp", "atomics"],
    description: `## Parallel Reduction

Compute the sum of N elements as fast as possible. This pattern is everywhere: loss computation, gradient accumulation, softmax normalization.

**Task:** Reduce array A of N floats to a single sum.

**Levels of optimization:**
1. ⚔️ Basic: Tree reduction with shared memory
2. 🏆 Advanced: Warp-level primitives (\`__shfl_down_sync\`)
3. 💀 Legend: Vectorized loads + warp reduction

**Target:** Match cuBLAS performance within 20%`,
    examples: [
      { input: "A=[1,2,3,4,5,6,7,8]", output: "sum=36" }
    ],
    hints: [
      "Phase 1: Each block reduces to one value in shared memory",
      "Phase 2: Use atomic add to accumulate block results",
      "Warp shuffle: `val += __shfl_down_sync(0xffffffff, val, offset)`"
    ],
    starterCode: {
      cuda: `__global__ void reduce(float* input, float* output, int N) {
    extern __shared__ float sdata[];
    int tid = threadIdx.x;
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    
    sdata[tid] = (idx < N) ? input[idx] : 0.0f;
    __syncthreads();
    
    // TODO: Tree reduction in shared memory
    // Then atomic add to output
}`,
      cpu_reference: `float sum = 0; for(int i=0;i<N;i++) sum += A[i];`
    },
    solution: `for (int s = blockDim.x/2; s > 32; s >>= 1) {
    if (tid < s) sdata[tid] += sdata[tid + s];
    __syncthreads();
}
if (tid < 32) { // warp reduce
    sdata[tid] += sdata[tid+32]; sdata[tid] += sdata[tid+16];
    sdata[tid] += sdata[tid+8];  sdata[tid] += sdata[tid+4];
    sdata[tid] += sdata[tid+2];  sdata[tid] += sdata[tid+1];
}
if (tid == 0) atomicAdd(output, sdata[0]);`,
    testCases: [
      { id: 1, description: "N=1024 sum correctness", pass: true },
      { id: 2, description: "N=10^7 sum correctness", pass: true },
      { id: 3, description: "Non-power-of-2 N", pass: true },
      { id: 4, description: "Performance benchmark", pass: true }
    ],
    conceptExplanation: "Parallel reduction converts O(N) serial work to O(log N) parallel steps. Warp-level intrinsics eliminate shared memory for the last warp.",
    companies: ["NVIDIA", "Meta", "OpenAI"],
    acceptance: 41
  },

  // ==================== MEMORY ARCHITECTURE ====================
  {
    id: "memory-coalescing",
    title: "Memory Coalescing Detective",
    slug: "memory-coalescing",
    difficulty: "warrior",
    category: "Memory Architecture",
    xp: 150,
    tags: ["memory", "coalescing", "profiling", "bandwidth"],
    description: `## Memory Coalescing Detective

Three kernels are given. Rank them by memory bandwidth efficiency and fix the worst one.

**Task:**
1. Identify which kernel has poor memory access patterns
2. Fix the strided access to achieve coalesced access
3. Measure the speedup

**The Suspects:**
- \`kernelA\`: Accesses \`data[idx]\`  
- \`kernelB\`: Accesses \`data[idx * 32]\`  
- \`kernelC\`: Transposed matrix read

**Background:** A warp = 32 threads. If all 32 threads access consecutive addresses → ONE memory transaction. Strided = 32 separate transactions = 32x bandwidth waste.`,
    examples: [
      { input: "Matrix 1024x1024 read", output: "Row-major: 900 GB/s, Col-major: 28 GB/s" }
    ],
    hints: [
      "Strided access pattern: thread i accesses element i*stride — terrible for coalescing",
      "Fix: transpose the matrix first, then read rows",
      "Use nvprof or Nsight to measure l2_global_load_transactions"
    ],
    starterCode: {
      cuda: `// Fix this kernel - terrible memory access
__global__ void badKernel(float* matrix, float* out, int N) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;
    if (idx < N) {
        // Column-major access in row-major storage — FIX THIS
        out[idx] = matrix[idx * N + blockIdx.x]; // BAD: stride of N
    }
}

// Your fixed version:
__global__ void fixedKernel(float* matrix, float* out, int N) {
    // TODO: Fix the access pattern
}`,
      cpu_reference: `// CPU: just reads row by row — always cache-friendly`
    },
    solution: `__global__ void fixedKernel(float* matrix, float* out, int N) {
    int col = threadIdx.x + blockIdx.x * blockDim.x;
    int row = blockIdx.y;
    // Coalesced: consecutive threads access consecutive columns
    if (col < N && row < N) out[row * N + col] = matrix[row * N + col];
}`,
    testCases: [
      { id: 1, description: "Correctness of fixed kernel", pass: true },
      { id: 2, description: "Speedup > 5x over bad kernel", pass: true }
    ],
    conceptExplanation: "The GPU memory controller combines requests from a warp into minimal transactions only if addresses are aligned and consecutive. Strided access destroys this.",
    companies: ["NVIDIA", "AMD"],
    acceptance: 55
  },
  {
    id: "shared-mem-bank-conflicts",
    title: "Shared Memory Bank Conflicts",
    slug: "bank-conflicts",
    difficulty: "legend",
    category: "Memory Architecture",
    xp: 300,
    tags: ["shared memory", "bank conflicts", "optimization"],
    description: `## Bank Conflict Elimination

Your matrix transpose has bank conflicts. Find them, fix them, achieve theoretical peak bandwidth.

**Background:** Shared memory is divided into 32 banks (on modern GPUs). If multiple threads in a warp access the same bank → serialized = bank conflict.

**Task:**
1. The given transpose kernel has 16-way bank conflicts
2. Identify WHY (hint: \`shmem[threadIdx.x][threadIdx.y]\` vs \`shmem[threadIdx.y][threadIdx.x]\`)  
3. Fix using padding: \`__shared__ float tile[TILE][TILE+1]\`
4. Verify with Nsight: \`shared_load_transactions_per_request = 1.0\``,
    examples: [
      { input: "32x32 tile transpose", output: "With conflict: 150 GB/s → Fixed: 600 GB/s" }
    ],
    hints: [
      "Padding by 1 element shifts each row to different starting bank",
      "32 banks, 4-byte width: bank = (addr / 4) % 32",
      "Column-major write into shared mem = all threads hit bank 0, 1, 2... but reading transposed = conflict"
    ],
    starterCode: {
      cuda: `#define TILE 32

// This has bank conflicts - fix it
__global__ void transpose_conflict(float* in, float* out, int N) {
    __shared__ float tile[TILE][TILE]; // CONFLICT!
    
    int x = blockIdx.x*TILE + threadIdx.x;
    int y = blockIdx.y*TILE + threadIdx.y;
    
    if (x < N && y < N) tile[threadIdx.y][threadIdx.x] = in[y*N + x];
    __syncthreads();
    
    x = blockIdx.y*TILE + threadIdx.x;
    y = blockIdx.x*TILE + threadIdx.y;
    if (x < N && y < N) out[y*N + x] = tile[threadIdx.x][threadIdx.y]; // CONFLICT
}

// Your fixed version:
__global__ void transpose_fixed(float* in, float* out, int N) {
    __shared__ float tile[TILE][TILE + ???]; // What goes here?
    // TODO
}`,
      cpu_reference: `for(int i=0;i<N;i++) for(int j=0;j<N;j++) out[j*N+i]=in[i*N+j];`
    },
    solution: `__shared__ float tile[TILE][TILE + 1]; // +1 padding eliminates bank conflicts`,
    testCases: [
      { id: 1, description: "Transpose correctness", pass: true },
      { id: 2, description: "Bank conflicts = 0 (verified by padding)", pass: true },
      { id: 3, description: "Bandwidth > 80% theoretical", pass: true }
    ],
    conceptExplanation: "Padding shifts row start addresses so that columns map to different banks. One extra element per row breaks the periodic bank conflict pattern.",
    companies: ["NVIDIA", "Qualcomm"],
    acceptance: 22
  },

  // ==================== PARALLEL ALGORITHMS ====================
  {
    id: "prefix-sum-scan",
    title: "Parallel Prefix Sum (Scan)",
    slug: "parallel-scan",
    difficulty: "warrior",
    category: "Parallel Algorithms",
    xp: 250,
    tags: ["scan", "prefix sum", "work-efficient", "algorithms"],
    description: `## Parallel Prefix Sum

Implement work-efficient parallel scan (prefix sum). Used in: stream compaction, radix sort, histogram building, BFS on GPU.

**Task:** Given A = [a₀, a₁, ..., aₙ₋₁], compute B where B[i] = A[0] + A[1] + ... + A[i-1] (exclusive scan).

**Algorithms:**
1. **Naïve:** O(N log N) work, O(log N) steps — wasteful
2. **Blelloch (Work-Efficient):** O(N) work, O(log N) steps — THIS is what you implement

**The Blelloch Scan:**
- Up-sweep (reduce) phase: build partial sums tree
- Down-sweep phase: propagate prefix sums back down`,
    examples: [
      { input: "[1,2,3,4,5]", output: "[0,1,3,6,10]" }
    ],
    hints: [
      "Up-sweep: for d=1 to log(N): A[k + 2^d - 1] += A[k + 2^(d-1) - 1]",
      "Down-sweep: set A[N-1]=0, then swap and add pairs going down",
      "Use in-place shared memory, power of 2 array size"
    ],
    starterCode: {
      cuda: `__global__ void exclusiveScan(float* data, float* output, int N) {
    extern __shared__ float temp[];
    int tid = threadIdx.x;
    
    // Load input
    temp[2*tid]   = (2*tid < N)   ? data[2*tid]   : 0;
    temp[2*tid+1] = (2*tid+1 < N) ? data[2*tid+1] : 0;
    
    // TODO: Up-sweep (reduce) phase
    
    // TODO: Clear last element (for exclusive scan)
    
    // TODO: Down-sweep phase
    
    if (2*tid < N)   output[2*tid]   = temp[2*tid];
    if (2*tid+1 < N) output[2*tid+1] = temp[2*tid+1];
}`,
      cpu_reference: `output[0]=0; for(int i=1;i<N;i++) output[i]=output[i-1]+input[i-1];`
    },
    solution: `// Up-sweep
int offset = 1;
for (int d = N>>1; d > 0; d >>= 1) {
    __syncthreads();
    if (tid < d) { int ai=offset*(2*tid+1)-1, bi=offset*(2*tid+2)-1; temp[bi]+=temp[ai]; }
    offset *= 2;
}
if (tid == 0) temp[N-1] = 0; // exclusive: clear last
// Down-sweep  
for (int d = 1; d < N; d *= 2) {
    offset >>= 1; __syncthreads();
    if (tid < d) { int ai=offset*(2*tid+1)-1, bi=offset*(2*tid+2)-1;
        float t=temp[ai]; temp[ai]=temp[bi]; temp[bi]+=t; }
}`,
    testCases: [
      { id: 1, description: "N=8 correctness", pass: true },
      { id: 2, description: "N=1024 correctness", pass: true },
      { id: 3, description: "Work complexity O(N)", pass: true }
    ],
    conceptExplanation: "The Blelloch scan does exactly N-1 additions (O(N) work) in O(log N) parallel steps — optimal work-efficiency. Foundation of GPU sorting algorithms.",
    companies: ["NVIDIA", "Google", "Codeforces"],
    acceptance: 28
  },

  // ==================== HARDWARE ARCHITECTURE ====================
  {
    id: "warp-divergence",
    title: "Warp Divergence Debugger",
    slug: "warp-divergence",
    difficulty: "warrior",
    category: "Hardware Architecture",
    xp: 180,
    tags: ["warp", "divergence", "control flow", "SIMT"],
    description: `## Warp Divergence Debugger

A kernel has severe warp divergence causing 8x slowdown. Find it. Fix it.

**Background:** A warp = 32 threads executing SAME instruction. If threads take different branches (if/else), the warp serializes both paths. Both paths execute for ALL threads, with inactive threads masked out.

**Worst case:** 32 threads, 32 different branches → 1/32 efficiency.

**Task:** Rewrite the divergent kernel to eliminate branches. Techniques:
- Predication (branchless arithmetic)
- Data reorganization (sort by branch type)
- Min/max tricks instead of if-else`,
    examples: [
      { input: "if (x > 0) out = x; else out = -x;", output: "out = abs(x); // no divergence" }
    ],
    hints: [
      "Branchless abs: `int mask = x >> 31; (x + mask) ^ mask`",
      "Branchless min: `a < b ? a : b` → compiler often generates cmov (no branch)",
      "Sort input data so same-branch threads are in same warp"
    ],
    starterCode: {
      cuda: `// This kernel has terrible warp divergence - rewrite it
__global__ void divergentKernel(float* data, float* out, int N) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;
    if (idx < N) {
        if (data[idx] > 100.0f) {
            out[idx] = sqrtf(data[idx]);
        } else if (data[idx] > 10.0f) {
            out[idx] = data[idx] * data[idx];
        } else if (data[idx] > 0.0f) {
            out[idx] = data[idx] * 2.0f;
        } else {
            out[idx] = 0.0f;
        }
    }
}

// Your optimized (branchless or restructured) version:
__global__ void fixedKernel(float* data, float* out, int N) {
    // TODO: Eliminate divergence
}`,
      cpu_reference: `for(int i=0;i<N;i++) { float v=data[i]; out[i]= v>100?sqrtf(v):v>10?v*v:v>0?v*2:0; }`
    },
    solution: `__global__ void fixedKernel(float* data, float* out, int N) {
    int idx = threadIdx.x + blockIdx.x * blockDim.x;
    if (idx >= N) return;
    float v = data[idx];
    // Branchless using arithmetic predicates
    float r = 0.0f;
    r += (v > 100.0f) * sqrtf(fmaxf(v, 0.0f));
    r += (v > 10.0f && v <= 100.0f) * (v * v);
    r += (v > 0.0f  && v <= 10.0f)  * (v * 2.0f);
    out[idx] = r;
}`,
    testCases: [
      { id: 1, description: "Correctness vs reference", pass: true },
      { id: 2, description: "Speedup > 2x over divergent version", pass: true },
      { id: 3, description: "No branch instructions in SASS", pass: true }
    ],
    conceptExplanation: "SIMT (Single Instruction, Multiple Threads) is the GPU execution model. Warp divergence is the #1 cause of performance loss in irregular algorithms.",
    companies: ["NVIDIA", "AMD", "Qualcomm"],
    acceptance: 47
  },
  {
    id: "occupancy-optimization",
    title: "SM Occupancy Maximizer",
    slug: "sm-occupancy",
    difficulty: "legend",
    category: "Hardware Architecture",
    xp: 350,
    tags: ["occupancy", "registers", "shared memory", "SM"],
    description: `## SM Occupancy Maximizer

Your kernel runs at 25% SM occupancy. Analyze the bottlenecks. Tune it to >75%.

**Background:** Occupancy = active warps / max warps per SM. Low occupancy → SM stalls waiting for memory, can't hide latency.

**Bottlenecks:**
1. **Register pressure:** Too many registers → fewer warps can fit on SM
2. **Shared memory:** Too much shmem → fewer blocks per SM
3. **Block size:** Wrong block size → wasted slots

**Task:**
1. Use \`__launch_bounds__\` to control register allocation
2. Tune shared memory usage
3. Find optimal block size using CUDA Occupancy Calculator API
4. Report: registers/thread, shmem/block, occupancy%`,
    examples: [
      { input: "BlockSize=1024, shmem=48KB → 25% occupancy", output: "BlockSize=256, shmem=8KB → 75% occupancy" }
    ],
    hints: [
      "`cudaOccupancyMaxActiveBlocksPerMultiprocessor()` gives theoretical occupancy",
      "`__launch_bounds__(MAX_THREADS, MIN_BLOCKS)` hints register allocator",
      "Registers per SM / registers per thread = max warps from register constraint"
    ],
    starterCode: {
      cuda: `// This kernel is register-hungry with too much shared mem
__global__ void heavyKernel(float* data, float* out, int N) {
    // 128KB shared mem - way too much
    __shared__ float bigBuffer[32768]; // 128KB on its own!
    
    // 64 local variables eating registers
    float r0,r1,r2,r3,r4,r5,r6,r7,r8,r9;
    float r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;
    // ... lots more
    
    int idx = threadIdx.x + blockIdx.x * blockDim.x;
    // TODO: Refactor to improve occupancy
}

// Add launch bounds and reduce resources:
__launch_bounds__(???, ???)
__global__ void optimizedKernel(float* data, float* out, int N) {
    __shared__ float smallBuffer[???]; // Right-sized
    // TODO
}`,
      cpu_reference: `// N/A - architecture exercise`
    },
    solution: `__launch_bounds__(256, 4) // max 256 threads, min 4 blocks
__global__ void optimizedKernel(float* data, float* out, int N) {
    __shared__ float smallBuffer[256]; // 1KB, leaves room for more blocks
    // Use register reuse patterns, minimize live variables
}`,
    testCases: [
      { id: 1, description: "Occupancy report printed", pass: true },
      { id: 2, description: "Occupancy > 50%", pass: true },
      { id: 3, description: "Correctness maintained", pass: true }
    ],
    conceptExplanation: "Each SM has fixed resources: ~65536 registers, 64-100KB shared mem, max 1024-2048 threads. Fitting more warps hides memory latency via context switching.",
    companies: ["NVIDIA", "AMD", "Intel"],
    acceptance: 18
  },

  // ==================== ADVANCED GPU ====================
  {
    id: "flash-attention-micro",
    title: "Flash Attention (Micro)",
    slug: "flash-attention-micro",
    difficulty: "legend",
    category: "Advanced GPU",
    xp: 500,
    tags: ["attention", "transformers", "IO-aware", "fusion"],
    description: `## Flash Attention — Micro Implementation

Implement a simplified Flash Attention kernel. The algorithm that changed transformer training forever.

**Problem:** Standard attention: Q, K, V ∈ R^{N×d}
- Naive: compute full N×N attention matrix → O(N²) memory → GPU OOM for long sequences
- Flash Attention: tile the computation, never materialize full N×N → O(N) memory

**Task (Simplified, N≤1024, d=64):**
1. Tile Q into blocks of size Br=16
2. For each Q-block: iterate over K, V blocks, compute local softmax with rescaling
3. Accumulate output using the log-sum-exp trick
4. Never write the N×N attention matrix to global memory

**This is the kernel inside every modern LLM.**`,
    examples: [
      { input: "Q,K,V: 64×64 tensors", output: "O: 64×64 (same as naive, but O(N) memory)" }
    ],
    hints: [
      "Online softmax: maintain (max, sum) accumulators to rescale without the full row",
      "For each K-block: m_new = max(m_old, rowmax(QK^T)), rescale acc by exp(m_old - m_new)",
      "Flash Attention 2 reorders loops to maximize GPU utilization"
    ],
    starterCode: {
      cuda: `// Simplified Flash Attention - single head, float32
// Q, K, V: [N, d], O: [N, d]
__global__ void flashAttention(
    const float* Q, const float* K, const float* V,
    float* O, int N, int d, float scale) {
    
    // Each block handles Br rows of Q
    const int Br = 16, Bc = 16;
    
    extern __shared__ float sram[]; // Q_tile, K_tile, V_tile, S_tile
    float* Qi = sram;
    float* Kj = Qi + Br * d;
    float* Vj = Kj + Bc * d;
    float* Sij = Vj + Bc * d;
    
    // Accumulators per row: output O_i, running max m_i, running sum l_i
    float O_i[64] = {0};  // d=64
    float m_i = -1e9f;
    float l_i = 0.0f;
    
    int row_start = blockIdx.x * Br;
    
    // TODO: Load Q tile, iterate over KV tiles, implement online softmax
}`,
      cpu_reference: `// Naive O(N^2) reference: compute full softmax(QK^T)V`
    },
    solution: `// Core loop structure:
for (int j = 0; j < N; j += Bc) {
    // Load Kj, Vj into sram
    // Compute Sij = Qi * Kj^T * scale  
    float m_new = m_i;
    for(int c=0; c<Bc; c++) m_new = fmaxf(m_new, Sij[ty*Bc+c]);
    float l_new = expf(m_i - m_new) * l_i;
    for(int c=0; c<Bc; c++) l_new += expf(Sij[ty*Bc+c] - m_new);
    // Rescale O_i: O_i = (l_i * exp(m_i-m_new) * O_i + exp(Sij-m_new)*Vj) / l_new
    m_i = m_new; l_i = l_new;
}`,
    testCases: [
      { id: 1, description: "Output matches naive attention (tol 1e-4)", pass: true },
      { id: 2, description: "Peak memory O(N) not O(N²)", pass: true },
      { id: 3, description: "Handles N=1024 without OOM", pass: true },
      { id: 4, description: "Performance > 0.5x cuDNN Flash Attention", pass: true }
    ],
    conceptExplanation: "Flash Attention uses the online softmax trick (Dao et al., 2022). By processing in tiles and maintaining running (max, sum) statistics, it fuses the attention computation into one pass, reducing memory IO by 5-20x.",
    companies: ["Together AI", "NVIDIA", "OpenAI", "Hugging Face"],
    acceptance: 8
  },
  {
    id: "custom-cuda-kernel-triton",
    title: "Triton: Write Your Own Op",
    slug: "triton-custom-op",
    difficulty: "legend",
    category: "Advanced GPU",
    xp: 400,
    tags: ["triton", "python", "compiler", "kernel fusion"],
    description: `## Triton: Custom GPU Op

Use OpenAI Triton to write a fused kernel that beats PyTorch's built-in implementation.

**Task:** Implement fused Layer Normalization in Triton.

LayerNorm: \`y = (x - mean(x)) / sqrt(var(x) + eps) * gamma + beta\`

**Why Triton?**
- Write Python, get GPU-speed code
- Triton handles memory coalescing, tiling, register allocation automatically
- Used by: PyTorch 2.0 compile, FlashAttention, xFormers

**Goal:** Fuse mean+variance+normalize+affine into ONE kernel pass (vs PyTorch's 3 kernels).`,
    examples: [
      { input: "x: [B, N], gamma: [N], beta: [N]", output: "y: [B, N] normalized" }
    ],
    hints: [
      "`tl.load`, `tl.store`, `tl.sum`, `tl.sqrt` are your primitives",
      "Use `BLOCK_SIZE = triton.next_power_of_2(N)` for tile sizing",
      "`tl.constexpr` for compile-time constants"
    ],
    starterCode: {
      cuda: `import triton
import triton.language as tl
import torch

@triton.jit
def layernorm_kernel(
    x_ptr, y_ptr, gamma_ptr, beta_ptr,
    N, eps,
    BLOCK_SIZE: tl.constexpr
):
    row = tl.program_id(0)
    cols = tl.arange(0, BLOCK_SIZE)
    mask = cols < N
    
    x = tl.load(x_ptr + row * N + cols, mask=mask, other=0.0)
    
    # TODO: Compute mean, variance, normalize, apply gamma+beta
    # Store result
    
def layernorm(x, gamma, beta, eps=1e-5):
    B, N = x.shape
    y = torch.empty_like(x)
    BLOCK = triton.next_power_of_2(N)
    layernorm_kernel[(B,)](x, y, gamma, beta, N, eps, BLOCK_SIZE=BLOCK)
    return y`,
      cpu_reference: `y = (x - x.mean(-1,keepdim=True)) / (x.var(-1,keepdim=True,unbiased=False)+eps).sqrt() * gamma + beta`
    },
    solution: `mean = tl.sum(x, axis=0) / N
var = tl.sum((x - mean) * (x - mean), axis=0) / N
x_norm = (x - mean) / tl.sqrt(var + eps)
gamma = tl.load(gamma_ptr + cols, mask=mask)
beta = tl.load(beta_ptr + cols, mask=mask)
y = x_norm * gamma + beta
tl.store(y_ptr + row * N + cols, y, mask=mask)`,
    testCases: [
      { id: 1, description: "Matches torch.nn.LayerNorm (tol 1e-5)", pass: true },
      { id: 2, description: "Single kernel (fused)", pass: true },
      { id: 3, description: "Faster than unfused baseline", pass: true }
    ],
    conceptExplanation: "Kernel fusion eliminates intermediate memory reads/writes. LayerNorm done naively = 3 passes over data. Fused = 1 pass. Triton lets you write this in Python-like code with C speed.",
    companies: ["OpenAI", "Meta", "Stability AI"],
    acceptance: 12
  },

  // ==================== HARDWARE FUNDAMENTALS ====================
  {
    id: "cache-hierarchy-probe",
    title: "Cache Hierarchy Probe",
    slug: "cache-probe",
    difficulty: "warrior",
    category: "Hardware Fundamentals",
    xp: 200,
    tags: ["cache", "latency", "L1", "L2", "memory hierarchy"],
    description: `## Cache Hierarchy Probe

Write a benchmark that empirically measures L1, L2, L3 cache sizes and latencies — without looking at specs.

**Task:** By varying access stride and array size, detect the inflection points where latency jumps.

**What you're building:**
- Array sizes: 1KB to 512MB
- Pointer-chasing loop (defeats prefetcher)  
- Measure ns/access at each size
- Plot: size vs latency reveals L1 (fast), L2 (medium), L3 (slow), DRAM (very slow)

**The catch:** Prefetchers are smart. Use random pointer chasing to defeat them.`,
    examples: [
      { input: "4KB array", output: "~4 cycles (L1 hit)" },
      { input: "256KB array", output: "~12 cycles (L2 hit)" },
      { input: "8MB array", output: "~40 cycles (L3 hit)" },
      { input: "256MB array", output: "~200 cycles (DRAM)" }
    ],
    hints: [
      "Pointer chase: `p = *p` where p is a randomized linked list through the array",
      "Measure with `rdtsc` (x86) or `clock_gettime`",
      "Repeat 10M times for stable measurement, divide by iterations"
    ],
    starterCode: {
      cuda: `#include <stdlib.h>
#include <stdio.h>
#include <time.h>

// Build a random pointer-chase chain through 'size' bytes
void buildChain(char* buf, size_t size) {
    // TODO: Create random permutation of 64-byte-stride indices
    // Each element points to next random element in chain
}

double measureLatency(size_t size_bytes, int iterations) {
    char* buf = (char*)malloc(size_bytes);
    buildChain(buf, size_bytes);
    
    // TODO: Pointer chase, measure time, return ns/access
    
    free(buf);
    return 0;
}

int main() {
    size_t sizes[] = {4096, 8192, 16384, 32768, 65536, 131072, 
                      262144, 1048576, 4194304, 16777216, 67108864};
    for (int i = 0; i < 11; i++) {
        double lat = measureLatency(sizes[i], 10000000);
        printf("Size: %8zu KB | Latency: %.1f ns\\n", sizes[i]/1024, lat);
    }
    return 0;
}`,
      cpu_reference: `// This IS the CPU exercise - hardware probing`
    },
    solution: `// Fisher-Yates shuffle for random chain
// Pointer chase: volatile char* p = buf; for(i) p = *(char**)p;
// Time with: clock_gettime(CLOCK_MONOTONIC, &t)`,
    testCases: [
      { id: 1, description: "Detects at least 2 cache levels", pass: true },
      { id: 2, description: "L1 latency < 10ns", pass: true },
      { id: 3, description: "DRAM latency > 50ns", pass: true }
    ],
    conceptExplanation: "Cache hierarchy is the most important hardware concept. Every system programmer must understand L1/L2/L3/DRAM latency ratios: 4:12:40:200 cycles (roughly). This knowledge drives every cache-aware algorithm.",
    companies: ["Jane Street", "Citadel", "Google", "HFT firms"],
    acceptance: 52
  },
  {
    id: "simd-vectorization",
    title: "SIMD Intrinsics: AVX2 Accelerated Search",
    slug: "avx2-search",
    difficulty: "warrior",
    category: "Hardware Fundamentals",
    xp: 225,
    tags: ["SIMD", "AVX2", "intrinsics", "vectorization"],
    description: `## AVX2 SIMD: 8-Wide Float Comparison

Implement a fast threshold search using AVX2 intrinsics. Process 8 floats per instruction.

**Task:** Given array of N floats, find all indices where value > threshold. Return count and first 1000 indices.

**Tools:**
- \`_mm256_loadu_ps\`: load 8 floats  
- \`_mm256_cmp_ps\`: compare 8 floats simultaneously  
- \`_mm256_movemask_ps\`: get 8-bit mask of comparison results
- Manual loop is your baseline; AVX2 should be ~8x faster

**Compile:** \`gcc -O3 -mavx2 solution.c\``,
    examples: [
      { input: "[1.0, 5.0, 2.0, 8.0], threshold=3.0", output: "indices=[1,3], count=2" }
    ],
    hints: [
      "`_mm256_cmp_ps(a, b, _CMP_GT_OS)` returns 0xFFFFFFFF in lanes where a > b",
      "`_mm256_movemask_ps` extracts sign bits → 8-bit integer",
      "Use `__builtin_ctz(mask)` to find set bits efficiently"
    ],
    starterCode: {
      cuda: `#include <immintrin.h>
#include <stdio.h>

// Baseline: scalar search
int scalar_search(float* data, int N, float threshold, int* indices) {
    int count = 0;
    for (int i = 0; i < N; i++)
        if (data[i] > threshold) indices[count++] = i;
    return count;
}

// Your AVX2 implementation:
int avx2_search(float* data, int N, float threshold, int* indices) {
    __m256 thresh_vec = _mm256_set1_ps(threshold);
    int count = 0;
    
    // TODO: Process 8 elements at a time with AVX2
    // Handle remainder (N % 8 elements) with scalar fallback
    
    return count;
}

int main() {
    // Test and benchmark
}`,
      cpu_reference: `for(int i=0;i<N;i++) if(data[i]>threshold) indices[count++]=i;`
    },
    solution: `for (int i = 0; i <= N-8; i += 8) {
    __m256 v = _mm256_loadu_ps(data + i);
    __m256 cmp = _mm256_cmp_ps(v, thresh_vec, _CMP_GT_OS);
    int mask = _mm256_movemask_ps(cmp);
    while (mask) { int bit = __builtin_ctz(mask); indices[count++]=i+bit; mask&=mask-1; }
}`,
    testCases: [
      { id: 1, description: "Correctness vs scalar", pass: true },
      { id: 2, description: "Handles N not multiple of 8", pass: true },
      { id: 3, description: "Speedup > 4x for large N", pass: true }
    ],
    conceptExplanation: "SIMD (Single Instruction, Multiple Data) processes multiple data elements with one instruction. AVX2 = 256-bit = 8 floats simultaneously. Used in databases, ML inference, HFT.",
    companies: ["Intel", "Citadel", "Jane Street", "DuckDB"],
    acceptance: 38
  },

  // ==================== METAL / VULKAN ====================
  {
    id: "metal-compute-shader",
    title: "Metal Compute Shader: Image Filter",
    slug: "metal-image-filter",
    difficulty: "warrior",
    category: "Metal / Vulkan",
    xp: 220,
    tags: ["metal", "apple", "compute shader", "image processing"],
    description: `## Metal Compute Shader: Gaussian Blur

Implement a separable Gaussian blur using Metal Compute shaders on Apple Silicon.

**Why Metal?** 
- Apple M1/M2/M3 chips: CPU and GPU share memory (unified memory architecture)
- Zero-copy GPU buffers: no cudaMemcpy needed!
- Metal is ~2-3x faster than OpenGL for compute on Apple hardware

**Task:** Blur a 1920×1080 image with a 15×15 Gaussian kernel.
- Separable: do 1D horizontal pass, then 1D vertical pass (25x fewer MACs)
- Use threadgroup memory for coalesced access

**Target:** < 5ms on M1 Pro`,
    examples: [
      { input: "Sharp 1080p image", output: "Smoothly blurred image (σ=3.0)" }
    ],
    hints: [
      "Separable filter: 2D Gaussian(x,y) = Gaussian(x) × Gaussian(y)",
      "Load a strip into threadgroup memory, apply 1D kernel, write back",
      "Use `texture2d<float>` for optimal texture cache behavior"
    ],
    starterCode: {
      cuda: `// Metal Shading Language (MSL)
#include <metal_stdlib>
using namespace metal;

kernel void gaussianBlurH(
    texture2d<float, access::read>  inTex  [[texture(0)]],
    texture2d<float, access::write> outTex [[texture(1)]],
    constant float* kernel [[buffer(0)]],
    constant int&   radius [[buffer(1)]],
    uint2 gid [[thread_position_in_grid]]
) {
    // TODO: Horizontal pass
    // Sum: for k in [-radius, radius]: sum += kernel[k+radius] * inTex.read(gid + uint2(k, 0))
}

kernel void gaussianBlurV(/* similar */) {
    // TODO: Vertical pass
}`,
      cpu_reference: `// CPU: naive O(W*H*K^2) Gaussian — Metal is 50-100x faster`
    },
    solution: `float4 sum = float4(0);
for (int k = -radius; k <= radius; k++) {
    uint2 coord = uint2(clamp(int(gid.x)+k, 0, int(inTex.get_width())-1), gid.y);
    sum += kernel[k + radius] * inTex.read(coord);
}
outTex.write(sum, gid);`,
    testCases: [
      { id: 1, description: "Output matches CPU reference (tol 0.01)", pass: true },
      { id: 2, description: "Handles image boundaries", pass: true },
      { id: 3, description: "< 5ms on 1080p", pass: true }
    ],
    conceptExplanation: "Metal's unified memory eliminates the PCIe bottleneck on Apple Silicon. threadgroup memory (like CUDA shared memory) provides fast local storage for tile-based processing.",
    companies: ["Apple", "Adobe", "Final Cut Pro team"],
    acceptance: 44
  }
];

export const categories = [...new Set(problems.map(p => p.category))];
export const difficulties = ["novice", "warrior", "legend"];

export function getProblemBySlug(slug) {
  return problems.find(p => p.slug === slug);
}

export function getProblemsByCategory(cat) {
  return problems.filter(p => p.category === cat);
}
