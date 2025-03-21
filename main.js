const GRID_SIZE = 32;
const canvas = document.querySelector("canvas");

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();

// Configure the canvas
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
  device: device,
  format: canvasFormat,
});

// Create a buffer with the vertices for a single cell
const vertices = new Float32Array([
//   X,    Y
  -0.8, -0.8, // Triangle 1
   0.8, -0.8,
   0.8,  0.8,
  -0.8, -0.8, // Triangle 2
   0.8,  0.8,
  -0.8,  0.8,
]);
const vertexBuffer = device.createBuffer({
  label: "Cell vertices",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertices);

const vertexBufferLayout = {
  arrayStride: 8,
  attributes: [{
    format: "float32x2",
    offset: 0,
    shaderLocation: 0,
  }],
};

// Create the shader that will render the cells
const cellShaderModule = device.createShaderModule({
  label: "Cell shader",
  code: `
    struct VertexInput {
      @location(0) pos: vec2f,
      @builtin(instance_index) instance: u32,
    };
    struct VertexOutput {
      @builtin(position) pos: vec4f,
    };

    @group(0) @binding(0) var<uniform> grid: vec2f;

    @vertex
    fn vertexMain(input: VertexInput) -> VertexOutput {
      let i = f32(input.instance);
      let cell = vec2f(i % grid.x, floor(i / grid.x));
      let cellOffset = cell / grid * 2;
      let gridPos = (input.pos + 1) / grid - 1 + cellOffset;
      var output: VertexOutput;
      output.pos = vec4f(gridPos, 0, 1);
      return output;
    }

    @fragment
    fn fragmentMain() -> @location(0) vec4f {
      return vec4f(1, 0, 0, 1);
    }
  `,
});

// Create a pipeline that renders the cell
const cellPipeline = device.createRenderPipeline({
  label: "Cell pipeline",
  layout: "auto",
  vertex: {
    module: cellShaderModule,
    entryPoint: "vertexMain",
    buffers: [vertexBufferLayout],
  },
  fragment: {
    module: cellShaderModule,
    entryPoint: "fragmentMain",
    targets: [{
      format: canvasFormat,
    }],
  },
});

// Create a uniform buffer that describes the grid
const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
const uniformBuffer = device.createBuffer({
  label: "Grid Uniforms",
  size: uniformArray.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

// Create a bind group to pass the grid uniforms into the pipeline
const bindGroup = device.createBindGroup({
  label: "Cell renderer bind group",
  layout: cellPipeline.getBindGroupLayout(0),
  entries: [{
    binding: 0,
    resource: { buffer: uniformBuffer },
  }],
});

// Clear the canvas with a render pass
const encoder = device.createCommandEncoder();

const pass = encoder.beginRenderPass({
  colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    loadOp: "clear",
    clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
    storeOp: "store",
  }],
});

pass.setPipeline(cellPipeline);
pass.setBindGroup(0, bindGroup);
pass.setVertexBuffer(0, vertexBuffer);
pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

pass.end();

device.queue.submit([encoder.finish()]);
