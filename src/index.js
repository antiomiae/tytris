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

  const p = new api.Program(
    `
      #version 300 es

      in vec2 position;
      in vec2 tex_coord;

      out vec2 out_tex_coord;

      uniform mat4 view_projection;

      void main() {
          gl_Position = vec4(position, 0, 1);
          out_tex_coord = tex_coord;
      }
      `,
    `
      #version 300 es
      precision mediump float;

      out vec4 outColor;  // you can pick any name

      void main() {
         outColor = vec4(1, 1, 1, 1);
      }
      `
  )

  const vao = new api.Vao(p)

  const vertexBatch = new api.VertexBatch(p.attributes)

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

  const indexedVertexBatch = new api.IndexedVertexBatch(p.attributes, 3, 1000)

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

  p.bind()
  api.drawBatch(indexedVertexBatch, vao)
  api.logErrors()
}

window.onload = bootstrap
