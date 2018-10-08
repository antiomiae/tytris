import _api from './api.js'

const createCanvas = (width, height) => {
  const el = document.createElement('canvas')
  el.width = width
  el.height = height
  return el
}

const bootstrap = () => {
  const canvas = createCanvas(640, 480)
  document.body.appendChild(canvas)
  const gl = canvas.getContext('webgl2')
  const api = _api(gl)
  console.log(api)

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT)

  const program = new api.Program(require('./shaders/basic.vert.glsl'), require('./shaders/basic.frag.glsl'))

  const vao = new api.Vao(program)

  const vertexBatch = new api.VertexBatch(program.attributes)

  vertexBatch.addVertex({
    position: [0, 0],
    tex_coord: [0, 0]
  })

  vertexBatch.addVertex({
    position: [1, 1],
    tex_coord: [1, 1]
  })

  vertexBatch.addVertex({
    position: [1, 0],
    tex_coord: [1, 0]
  })

  vertexBatch.addVertex({
    position: [0, 1],
    tex_coord: [0, 1]
  })

  const indexedVertexBatch = new api.IndexedVertexBatch(program.attributes, 3, 1000)

  indexedVertexBatch.addPrimitives(
    [{
        position: [0, 0], // B L
        tex_coord: [0, 0]
      },
      {
        position: [1, 0], // B R
        tex_coord: [1, 0]
      },
      {
        position: [0, 1], // T L
        tex_coord: [0, 1]
      },
      {
        position: [1, 1], // T R
        tex_coord: [1, 1]
      }
    ], [0, 1, 2, 3, 2, 1])

  indexedVertexBatch.addPrimitives(
    [{
        position: [0, 0], // B L
        tex_coord: [0, 0]
      },
      {
        position: [1, 0], // B R
        tex_coord: [1, 0]
      },
      {
        position: [0, 1], // T L
        tex_coord: [0, 1]
      },
      {
        position: [1, 1], // T R
        tex_coord: [1, 1]
      }
    ], [0, 1, 2, 3, 2, 1])

  program.bind()
  api.drawBatch(indexedVertexBatch, vao)
  api.logErrors()
}

window.onload = bootstrap
